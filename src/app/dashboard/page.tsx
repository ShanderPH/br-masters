import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("id, firebase_id, role, favorite_team_id")
    .eq("id", user.id)
    .single();

  if (!userRow) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, total_points, level, xp")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  type UserRowT = { id: string; firebase_id: string | null; role: string; favorite_team_id: string | null };
  type ProfileT = { first_name: string; last_name: string | null; total_points: number; level: number; xp: number };
  const ur = userRow as UserRowT;
  const pr = profile as ProfileT;

  const { data: prizePool } = await supabase
    .from("prize_pools")
    .select("*")
    .limit(1)
    .single();

  const { data: rankingProfiles } = await supabase
    .from("user_profiles")
    .select("id, first_name, last_name, total_points, is_public")
    .eq("is_public", true)
    .order("total_points", { ascending: false })
    .limit(10);

  type RankProfileRow = { id: string; first_name: string; last_name: string | null; total_points: number };
  const rankProfiles = (rankingProfiles as RankProfileRow[] | null) || [];

  const rankTeamsMap: Map<string, string | null> = new Map();
  if (rankProfiles.length > 0) {
    const rankUserIds = rankProfiles.map((p) => p.id);
    const { data: rankUsersData } = await supabase
      .from("users")
      .select("id, favorite_team_id")
      .in("id", rankUserIds);
    type RankUserRow = { id: string; favorite_team_id: string | null };
    const rankUsers = (rankUsersData as RankUserRow[] | null) || [];
    const teamIds = [...new Set(rankUsers.map((u) => u.favorite_team_id).filter(Boolean))] as string[];
    if (teamIds.length > 0) {
      const { data: teamsData } = await supabase.from("teams").select("id, logo_url").in("id", teamIds);
      type TeamRow = { id: string; logo_url: string | null };
      const teams = (teamsData as TeamRow[] | null) || [];
      const teamsLookup = new Map(teams.map((t) => [t.id, t.logo_url]));
      rankUsers.forEach((u) => {
        rankTeamsMap.set(u.id, u.favorite_team_id ? teamsLookup.get(u.favorite_team_id) ?? null : null);
      });
    }
  }

  const { data: upcomingRows } = await supabase
    .from("upcoming_matches")
    .select("*")
    .order("start_time", { ascending: true })
    .limit(5);

  type UpcomingRow = {
    id: string; slug: string; start_time: string; status: string;
    home_team_name: string; home_team_code: string; home_team_logo: string | null;
    away_team_name: string; away_team_code: string; away_team_logo: string | null;
  };
  const upcoming = (upcomingRows as UpcomingRow[] | null) || [];

  const matchIds = upcoming.map((m) => m.id);
  let predictedMatchIds = new Set<string>();
  if (matchIds.length > 0) {
    const { data: preds } = await supabase
      .from("predictions")
      .select("match_id")
      .eq("user_id", user.id)
      .in("match_id", matchIds);
    type PredRow = { match_id: string };
    predictedMatchIds = new Set((preds as PredRow[] | null)?.map((p) => p.match_id) || []);
  }

  const { count: totalPredictions } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const userName = `${pr.first_name}${pr.last_name ? ` ${pr.last_name}` : ""}`;

  const userData = {
    id: ur.firebase_id || user.id,
    supabaseId: user.id,
    name: userName,
    points: pr.total_points || 0,
    level: pr.level || 1,
    xp: pr.xp || 0,
    role: ur.role as "user" | "admin",
  };

  const stats = {
    totalPredictions: totalPredictions ?? 0,
    correctPredictions: 0,
    exactScores: 0,
    accuracy: 0,
  };

  const ranking = rankProfiles.map((p, index) => ({
    id: p.id,
    name: `${p.first_name}${p.last_name ? ` ${p.last_name}` : ""}`,
    points: p.total_points || 0,
    position: index + 1,
    teamLogo: rankTeamsMap.get(p.id) ?? null,
  }));

  const matches = upcoming.map((m) => ({
    id: m.id,
    homeTeam: {
      name: m.home_team_name,
      shortName: m.home_team_code || m.home_team_name.substring(0, 3).toUpperCase(),
      logo: m.home_team_logo || undefined,
    },
    awayTeam: {
      name: m.away_team_name,
      shortName: m.away_team_code || m.away_team_name.substring(0, 3).toUpperCase(),
      logo: m.away_team_logo || undefined,
    },
    startTime: m.start_time,
    status: m.status as "scheduled" | "live" | "finished",
    hasPrediction: predictedMatchIds.has(m.id),
  }));

  type PrizeRow = { total_approved: number; participants_count: number } | null;
  const pp = prizePool as PrizeRow;

  const prizePoolData = {
    total: pp?.total_approved || 0,
    participants: pp?.participants_count || 0,
  };

  return (
    <DashboardClient
      user={userData}
      stats={stats}
      ranking={ranking}
      matches={matches}
      prizePool={prizePoolData}
    />
  );
}
