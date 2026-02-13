import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { RankingClient } from "./ranking-client";

export default async function RankingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const { data: generalRanking } = await supabase
    .from("users_profiles")
    .select("id, firebase_id, name, points, predictions_count, favorite_team_logo")
    .order("points", { ascending: false })
    .limit(50);

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, short_name, logo_url, status")
    .eq("status", "active")
    .neq("name", "Copa do Brasil 2026")
    .order("display_order", { ascending: true });

  type TournamentRow = {
    id: number;
    name: string;
    short_name: string | null;
    logo_url: string | null;
    status: string;
  };

  const tournamentsList = (tournaments as TournamentRow[] | null) || [];

  const { data: tournamentPoints } = await supabase
    .from("user_tournament_points")
    .select("user_id, tournament_id, points, previous_rank, predictions_count, correct_results, exact_scores")
    .order("points", { ascending: false });

  type TournamentPointRow = {
    user_id: string;
    tournament_id: number;
    points: number;
    previous_rank: number | null;
    predictions_count: number;
    correct_results: number;
    exact_scores: number;
  };

  const tpRows = (tournamentPoints as TournamentPointRow[] | null) || [];

  const userData = {
    id: profile.firebase_id || user.id,
    name: profile.name || "Jogador",
    points: profile.points || 0,
    level: profile.level || 1,
    role: (profile.role || "user") as "user" | "admin",
  };

  const formattedGeneralRanking = (generalRanking || []).map((player) => ({
    id: player.firebase_id || player.id,
    name: player.name || "Jogador",
    points: player.points || 0,
    predictions: player.predictions_count || 0,
    exactScores: 0,
    accuracy: 0,
    favoriteTeamLogo: player.favorite_team_logo || null,
  }));

  const tournamentRankings: Record<string, Array<{
    id: string;
    name: string;
    points: number;
    predictions: number;
    exactScores: number;
    accuracy: number;
    favoriteTeamLogo: string | null;
    currentRank: number | null;
    previousRank: number | null;
  }>> = {};

  if (tpRows.length > 0) {
    const firebaseIds = [...new Set(tpRows.map((tp) => tp.user_id))];
    const { data: tournamentUsers } = await supabase
      .from("users_profiles")
      .select("id, firebase_id, name, favorite_team_logo")
      .in("firebase_id", firebaseIds);

    const userMap = new Map(
      (tournamentUsers || []).map((u) => [u.firebase_id, u])
    );

    tpRows.forEach((tp) => {
      const tournamentId = String(tp.tournament_id);
      if (!tournamentRankings[tournamentId]) {
        tournamentRankings[tournamentId] = [];
      }

      const userProfile = userMap.get(tp.user_id);
      if (userProfile) {
        const totalCorrect = (tp.correct_results || 0) + (tp.exact_scores || 0);
        const accuracy = tp.predictions_count > 0
          ? Math.round((totalCorrect / tp.predictions_count) * 100)
          : 0;

        tournamentRankings[tournamentId].push({
          id: userProfile.firebase_id || userProfile.id,
          name: userProfile.name || "Jogador",
          points: tp.points || 0,
          predictions: tp.predictions_count || 0,
          exactScores: tp.exact_scores || 0,
          accuracy: Math.min(accuracy, 100),
          favoriteTeamLogo: userProfile.favorite_team_logo || null,
          currentRank: null,
          previousRank: tp.previous_rank,
        });
      }
    });

    Object.keys(tournamentRankings).forEach((key) => {
      tournamentRankings[key].sort((a, b) => b.points - a.points);
    });
  }

  const tournamentsWithData = tournamentsList.filter((t) =>
    tournamentRankings[String(t.id)]?.length > 0
  );

  const formattedTournaments = tournamentsWithData.map((t) => ({
    id: String(t.id),
    name: t.short_name || t.name,
    logo: t.logo_url || "/images/brasileirao-logo.svg",
  }));

  return (
    <RankingClient
      user={userData}
      generalRanking={formattedGeneralRanking}
      tournamentRankings={tournamentRankings}
      tournaments={formattedTournaments}
    />
  );
}
