import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PartidasClient } from "./partidas-client";

export default async function PartidasPage() {
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

  // Get upcoming matches (next 14 days)
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .gte("start_time", now.toISOString())
    .lte("start_time", twoWeeksFromNow.toISOString())
    .order("start_time", { ascending: true });

  // Get user's predictions for these matches
  const matchIds = matches?.map((m) => m.id) || [];
  const { data: userPredictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", profile.firebase_id)
    .in("match_id", matchIds);

  // Create predictions map
  const predictionsMap: Record<number, { homeScore: number; awayScore: number }> = {};
  userPredictions?.forEach((p) => {
    predictionsMap[p.match_id] = {
      homeScore: p.home_team_goals,
      awayScore: p.away_team_goals,
    };
  });

  // Format user data
  const userData = {
    id: profile.firebase_id,
    name: profile.name,
    points: profile.points || 0,
    level: profile.level || 1,
    role: profile.role as "user" | "admin",
  };

  return (
    <PartidasClient
      user={userData}
      matches={matches || []}
      initialPredictions={predictionsMap}
    />
  );
}
