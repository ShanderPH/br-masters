import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Get prize pool
  const { data: prizePool } = await supabase
    .from("prize_pool")
    .select("*")
    .single();

  // Get ranking (top 10 users)
  const { data: rankingUsers } = await supabase
    .from("users_profiles")
    .select("id, firebase_id, name, points, favorite_team_logo")
    .eq("public_profile", true)
    .order("points", { ascending: false })
    .limit(10);

  // Get upcoming matches (next 7 days)
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("*")
    .gte("start_time", now.toISOString())
    .lte("start_time", weekFromNow.toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  // Get user's predictions for upcoming matches
  const matchIds = upcomingMatches?.map((m) => m.id) || [];
  const { data: userPredictions } = await supabase
    .from("predictions")
    .select("match_id")
    .eq("user_id", profile.firebase_id)
    .in("match_id", matchIds);

  const predictedMatchIds = new Set(userPredictions?.map((p) => p.match_id) || []);

  // Get user stats
  const { data: userPredictionsAll } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", profile.firebase_id);

  const totalPredictions = userPredictionsAll?.length || 0;

  // Format data for client component
  const userData = {
    id: profile.firebase_id,
    name: profile.name,
    points: profile.points || 0,
    level: profile.level || 1,
    role: profile.role as "user" | "admin",
  };

  const stats = {
    totalPredictions,
    correctPredictions: 0,
    exactScores: 0,
    accuracy: 0,
  };

  const ranking = (rankingUsers || []).map((user, index) => ({
    id: user.firebase_id,
    name: user.name,
    points: user.points || 0,
    position: index + 1,
    teamLogo: user.favorite_team_logo,
  }));

  const matches = (upcomingMatches || []).map((match) => ({
    id: String(match.id),
    homeTeam: {
      name: match.home_team_name,
      shortName: match.home_team_short_name || match.home_team_name.substring(0, 3).toUpperCase(),
      logo: match.home_team_logo || undefined,
    },
    awayTeam: {
      name: match.away_team_name,
      shortName: match.away_team_short_name || match.away_team_name.substring(0, 3).toUpperCase(),
      logo: match.away_team_logo || undefined,
    },
    startTime: match.start_time,
    status: match.status as "scheduled" | "live" | "finished",
    hasPrediction: predictedMatchIds.has(match.id),
  }));

  const prizePoolData = {
    total: prizePool?.total || 0,
    participants: prizePool?.participants || 0,
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
