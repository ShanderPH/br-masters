import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get("tournamentId");
  const round = searchParams.get("round") ? parseInt(searchParams.get("round")!) : null;

  // Use service client to bypass RLS for aggregate rankings
  const db = (process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase) as ReturnType<typeof createServiceClient>;

  type ProfileRow = { id: string; first_name: string; last_name: string | null; total_points?: number | null };
  type UserRow = { id: string; favorite_team_id: string | null };
  type TeamRow = { id: string; logo_url: string | null };

  const buildTeamLogoByUserId = async (userIds: string[]) => {
    const teamLogoByUserId = new Map<string, string | null>();
    if (userIds.length === 0) return teamLogoByUserId;

    const { data: usersData } = await db.from("users").select("id, favorite_team_id").in("id", userIds);
    const userRows = (usersData as UserRow[] | null) || [];
    const teamIdByUserId = new Map(userRows.map((u) => [u.id, u.favorite_team_id]));

    const teamIds = [...new Set(userRows.map((u) => u.favorite_team_id).filter(Boolean))] as string[];
    const teamLogoByTeamId = new Map<string, string | null>();
    if (teamIds.length > 0) {
      const { data: teamsData } = await db.from("teams").select("id, logo_url").in("id", teamIds);
      ((teamsData as TeamRow[] | null) || []).forEach((team) => {
        teamLogoByTeamId.set(team.id, team.logo_url);
      });
    }

    userIds.forEach((userId) => {
      const favTeamId = teamIdByUserId.get(userId);
      teamLogoByUserId.set(userId, favTeamId ? teamLogoByTeamId.get(favTeamId) ?? null : null);
    });

    return teamLogoByUserId;
  };

  const { data: generalProfilesData } = await db
    .from("user_profiles")
    .select("id, first_name, last_name, total_points")
    .order("total_points", { ascending: false })
    .limit(10);

  const generalProfiles = (generalProfilesData as ProfileRow[] | null) || [];
  const generalTeamLogoByUserId = await buildTeamLogoByUserId(generalProfiles.map((profile) => profile.id));

  const generalRanking = generalProfiles.map((profile, index) => ({
    id: profile.id,
    name: `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ""}`,
    points: profile.total_points || 0,
    rank: index + 1,
    teamLogo: generalTeamLogoByUserId.get(profile.id) ?? null,
  }));

  if (!tournamentId) {
    return NextResponse.json({
      generalRanking,
      tournamentRanking: [],
      roundRanking: [],
    });
  }

  // Fetch tournament ranking
  const { data: tournamentPreds } = await db
    .from("predictions")
    .select("user_id, points_earned, matches!inner(tournament_id)")
    .eq("matches.tournament_id", tournamentId)
    .not("points_earned", "is", null);

  type PredRow = { user_id: string; points_earned: number };
  const tpRows = (tournamentPreds as PredRow[] | null) || [];

  const tAggMap = new Map<string, number>();
  tpRows.forEach((r) => tAggMap.set(r.user_id, (tAggMap.get(r.user_id) || 0) + (r.points_earned || 0)));
  const tournamentSorted = [...tAggMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, points], idx) => ({ userId, points, rank: idx + 1 }));

  // Fetch round ranking
  let roundSorted: Array<{ userId: string; points: number; rank: number }> = [];
  if (round !== null) {
    const { data: roundPreds } = await db
      .from("predictions")
      .select("user_id, points_earned, matches!inner(tournament_id, round_number)")
      .eq("matches.tournament_id", tournamentId)
      .eq("matches.round_number", round)
      .not("points_earned", "is", null);

    const rpRows = (roundPreds as PredRow[] | null) || [];

    const rAggMap = new Map<string, number>();
    rpRows.forEach((r) => rAggMap.set(r.user_id, (rAggMap.get(r.user_id) || 0) + (r.points_earned || 0)));
    roundSorted = [...rAggMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, points], idx) => ({ userId, points, rank: idx + 1 }));
  }

  // Resolve user profiles and team logos
  const allUserIds = [...new Set([...tournamentSorted.map((r) => r.userId), ...roundSorted.map((r) => r.userId)])];

  if (allUserIds.length === 0) {
    return NextResponse.json({
      generalRanking,
      tournamentRanking: [],
      roundRanking: [],
    });
  }

  const { data: profilesData } = await db.from("user_profiles").select("id, first_name, last_name").in("id", allUserIds);
  const profileMap = new Map(((profilesData as ProfileRow[] | null) || []).map((p) => [p.id, p]));
  const teamLogoMap = await buildTeamLogoByUserId(allUserIds);

  const resolveUser = (userId: string, rank: number, points: number) => {
    const prof = profileMap.get(userId);
    return {
      id: userId,
      name: prof ? `${prof.first_name}${prof.last_name ? ` ${prof.last_name}` : ""}` : "Jogador",
      points,
      rank,
      teamLogo: teamLogoMap.get(userId) ?? null,
    };
  };

  return NextResponse.json({
    generalRanking,
    tournamentRanking: tournamentSorted.map((r) => resolveUser(r.userId, r.rank, r.points)),
    roundRanking: roundSorted.map((r) => resolveUser(r.userId, r.rank, r.points)),
  });
}
