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

  if (!tournamentId) {
    return NextResponse.json({ error: "tournamentId obrigatório" }, { status: 400 });
  }

  // Use service client to bypass RLS for aggregate rankings
  const db = (process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase) as ReturnType<typeof createServiceClient>;

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
    return NextResponse.json({ tournamentRanking: [], roundRanking: [] });
  }

  const [{ data: profilesData }, { data: usersData }] = await Promise.all([
    supabase.from("user_profiles").select("id, first_name, last_name").in("id", allUserIds),
    supabase.from("users").select("id, favorite_team_id").in("id", allUserIds),
  ]);

  type ProfileRow = { id: string; first_name: string; last_name: string | null };
  const profileMap = new Map(((profilesData as ProfileRow[] | null) || []).map((p) => [p.id, p]));

  type UserRow = { id: string; favorite_team_id: string | null };
  const userRows = (usersData as UserRow[] | null) || [];
  const teamIdByUserId = new Map(userRows.map((u) => [u.id, u.favorite_team_id]));

  const teamIds = [...new Set(userRows.map((u) => u.favorite_team_id).filter(Boolean))] as string[];
  let teamLogoMap = new Map<string, string | null>();
  if (teamIds.length > 0) {
    const { data: teamsData } = await supabase.from("teams").select("id, logo_url").in("id", teamIds);
    type TeamRow = { id: string; logo_url: string | null };
    teamLogoMap = new Map(((teamsData as TeamRow[] | null) || []).map((t) => [t.id, t.logo_url]));
  }

  const resolveUser = (userId: string, rank: number, points: number) => {
    const prof = profileMap.get(userId);
    const favTeamId = teamIdByUserId.get(userId);
    return {
      id: userId,
      name: prof ? `${prof.first_name}${prof.last_name ? ` ${prof.last_name}` : ""}` : "Jogador",
      points,
      rank,
      teamLogo: favTeamId ? teamLogoMap.get(favTeamId) ?? null : null,
    };
  };

  return NextResponse.json({
    tournamentRanking: tournamentSorted.map((r) => resolveUser(r.userId, r.rank, r.points)),
    roundRanking: roundSorted.map((r) => resolveUser(r.userId, r.rank, r.points)),
  });
}
