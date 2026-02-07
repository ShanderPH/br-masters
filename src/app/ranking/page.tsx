import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { RankingClient } from "./ranking-client";

export default async function RankingPage() {
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

  // Get general ranking
  const { data: generalRanking } = await supabase
    .from("users_profiles")
    .select("id, firebase_id, name, points, predictions_count, favorite_team_logo")
    .eq("public_profile", true)
    .order("points", { ascending: false });

  // Get tournament rankings
  const { data: tournamentPoints } = await supabase
    .from("user_tournament_points")
    .select("*")
    .order("points", { ascending: false });

  // Format user data
  const userData = {
    id: profile.firebase_id,
    name: profile.name,
    points: profile.points || 0,
    level: profile.level || 1,
    role: profile.role as "user" | "admin",
  };

  // Format general ranking
  const formattedGeneralRanking = (generalRanking || []).map((player) => ({
    id: player.firebase_id,
    name: player.name,
    points: player.points || 0,
    predictions: player.predictions_count || 0,
    exactScores: 0,
    accuracy: 0,
    favoriteTeamLogo: player.favorite_team_logo || "/images/logo/default-team.svg",
  }));

  // Group tournament points by tournament
  const tournamentRankings: Record<string, typeof formattedGeneralRanking> = {};
  
  if (tournamentPoints) {
    // Get user profiles for tournament points
    const userIds = [...new Set(tournamentPoints.map((tp) => tp.user_id))];
    const { data: tournamentUsers } = await supabase
      .from("users_profiles")
      .select("id, firebase_id, name, favorite_team_logo")
      .in("id", userIds);

    const userMap = new Map(
      (tournamentUsers || []).map((u) => [u.id, u])
    );

    tournamentPoints.forEach((tp) => {
      const tournamentId = String(tp.tournament_id);
      if (!tournamentRankings[tournamentId]) {
        tournamentRankings[tournamentId] = [];
      }
      
      const userProfile = userMap.get(tp.user_id);
      if (userProfile) {
        tournamentRankings[tournamentId].push({
          id: userProfile.firebase_id,
          name: userProfile.name,
          points: tp.points || 0,
          predictions: tp.predictions_count || 0,
          exactScores: tp.exact_scores || 0,
          accuracy: tp.predictions_count > 0 
            ? Math.round(((tp.correct_results || 0) / tp.predictions_count) * 100) 
            : 0,
          favoriteTeamLogo: userProfile.favorite_team_logo || "/images/logo/default-team.svg",
        });
      }
    });

    // Sort each tournament ranking by points
    Object.keys(tournamentRankings).forEach((key) => {
      tournamentRankings[key].sort((a, b) => b.points - a.points);
    });
  }

  return (
    <RankingClient
      user={userData}
      generalRanking={formattedGeneralRanking}
      tournamentRankings={tournamentRankings}
    />
  );
}
