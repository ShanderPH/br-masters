import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PalpitesClient } from "./palpites-client";

export default async function PalpitesPage() {
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

  const { data: seasons } = await supabase
    .from("tournament_seasons")
    .select("id, tournament_id, current_round_number")
    .eq("is_current", true);

  type SeasonRow = {
    id: number;
    tournament_id: number;
    current_round_number: number | null;
  };

  const seasonsList = (seasons as SeasonRow[] | null) || [];

  const seasonMap: Record<number, number> = {};
  seasonsList.forEach((s) => {
    if (s.current_round_number) {
      seasonMap[s.tournament_id] = s.current_round_number;
    }
  });

  const firebaseId = profile.firebase_id;

  const { data: predictions } = await supabase
    .from("predictions")
    .select("id, match_id, home_team_goals, away_team_goals, points_earned, is_correct, is_exact_score, tournament_id, predicted_at")
    .eq("user_id", firebaseId)
    .order("predicted_at", { ascending: false });

  type PredictionRow = {
    id: string;
    match_id: number;
    home_team_goals: number;
    away_team_goals: number;
    points_earned: number | null;
    is_correct: boolean | null;
    is_exact_score: boolean | null;
    tournament_id: number | null;
    predicted_at: string;
  };

  const predictionRows = (predictions as PredictionRow[] | null) || [];

  const matchIds = predictionRows.map((p) => p.match_id);

  let matchesData: Array<{
    id: number;
    round_number: number;
    home_team_name: string;
    home_team_short_name: string | null;
    home_team_logo: string | null;
    away_team_name: string;
    away_team_short_name: string | null;
    away_team_logo: string | null;
    start_time: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
    tournament_id: number;
  }> = [];

  if (matchIds.length > 0) {
    const { data: mData } = await supabase
      .from("matches")
      .select("id, round_number, home_team_name, home_team_short_name, home_team_logo, away_team_name, away_team_short_name, away_team_logo, start_time, status, home_score, away_score, tournament_id")
      .in("id", matchIds);

    matchesData = (mData as typeof matchesData) || [];
  }

  const matchMap = new Map(matchesData.map((m) => [m.id, m]));

  const formattedPredictions = predictionRows
    .map((p) => {
      const match = matchMap.get(p.match_id);
      if (!match) return null;

      return {
        id: p.id,
        matchId: p.match_id,
        homeTeamGoals: p.home_team_goals,
        awayTeamGoals: p.away_team_goals,
        pointsEarned: p.points_earned || 0,
        isCorrect: p.is_correct || false,
        isExactScore: p.is_exact_score || false,
        tournamentId: match.tournament_id,
        roundNumber: match.round_number,
        predictedAt: p.predicted_at,
        match: {
          id: match.id,
          homeTeamName: match.home_team_name,
          homeTeamShortName: match.home_team_short_name,
          homeTeamLogo: match.home_team_logo,
          awayTeamName: match.away_team_name,
          awayTeamShortName: match.away_team_short_name,
          awayTeamLogo: match.away_team_logo,
          startTime: match.start_time,
          status: match.status,
          homeScore: match.home_score,
          awayScore: match.away_score,
        },
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    matchId: number;
    homeTeamGoals: number;
    awayTeamGoals: number;
    pointsEarned: number;
    isCorrect: boolean;
    isExactScore: boolean;
    tournamentId: number;
    roundNumber: number;
    predictedAt: string;
    match: {
      id: number;
      homeTeamName: string;
      homeTeamShortName: string | null;
      homeTeamLogo: string | null;
      awayTeamName: string;
      awayTeamShortName: string | null;
      awayTeamLogo: string | null;
      startTime: string;
      status: string;
      homeScore: number | null;
      awayScore: number | null;
    };
  }>;

  const userData = {
    id: profile.firebase_id || user.id,
    name: profile.name || "Jogador",
    points: profile.points || 0,
    level: profile.level || 1,
    role: (profile.role || "user") as "user" | "admin",
  };

  const activeTournamentIds = new Set(tournamentsList.map((t) => t.id));

  const filteredPredictions = formattedPredictions.filter((p) =>
    activeTournamentIds.has(p.tournamentId)
  );

  const tournamentIdsWithPredictions = new Set(
    filteredPredictions.map((p) => p.tournamentId)
  );

  const tournamentsWithPredictions = tournamentsList.filter((t) =>
    tournamentIdsWithPredictions.has(t.id)
  );

  const formattedTournaments = tournamentsWithPredictions.map((t) => ({
    id: t.id,
    name: t.short_name || t.name,
    logo: t.logo_url || "/images/brasileirao-logo.svg",
  }));

  const allMatchIds = [...new Set(filteredPredictions.map((p) => p.matchId))];

  let allPredictionsForMatches: Array<{
    matchId: number;
    oddsUserId: string;
    userName: string;
    userTeamLogo: string | null;
    homeTeamGoals: number;
    awayTeamGoals: number;
    pointsEarned: number;
    isCorrect: boolean;
    isExactScore: boolean;
  }> = [];

  if (allMatchIds.length > 0) {
    const { data: otherPreds } = await supabase
      .from("predictions")
      .select("match_id, user_id, home_team_goals, away_team_goals, points_earned, is_correct, is_exact_score")
      .in("match_id", allMatchIds)
      .neq("user_id", firebaseId);

    type OtherPredRow = {
      match_id: number;
      user_id: string;
      home_team_goals: number;
      away_team_goals: number;
      points_earned: number | null;
      is_correct: boolean | null;
      is_exact_score: boolean | null;
    };

    const otherPredRows = (otherPreds as OtherPredRow[] | null) || [];

    if (otherPredRows.length > 0) {
      const otherUserIds = [...new Set(otherPredRows.map((p) => p.user_id))];
      const { data: otherProfiles } = await supabase
        .from("users_profiles")
        .select("firebase_id, name, favorite_team_logo")
        .in("firebase_id", otherUserIds);

      type OtherProfileRow = {
        firebase_id: string;
        name: string;
        favorite_team_logo: string | null;
      };

      const otherProfilesList = (otherProfiles as OtherProfileRow[] | null) || [];
      const otherProfileMap = new Map(otherProfilesList.map((p) => [p.firebase_id, p]));

      allPredictionsForMatches = otherPredRows.map((p) => {
        const prof = otherProfileMap.get(p.user_id);
        return {
          matchId: p.match_id,
          oddsUserId: p.user_id,
          userName: prof?.name || "Jogador",
          userTeamLogo: prof?.favorite_team_logo || null,
          homeTeamGoals: p.home_team_goals,
          awayTeamGoals: p.away_team_goals,
          pointsEarned: p.points_earned || 0,
          isCorrect: p.is_correct || false,
          isExactScore: p.is_exact_score || false,
        };
      });
    }
  }

  const otherPredictionsByMatch: Record<number, typeof allPredictionsForMatches> = {};
  allPredictionsForMatches.forEach((p) => {
    if (!otherPredictionsByMatch[p.matchId]) {
      otherPredictionsByMatch[p.matchId] = [];
    }
    otherPredictionsByMatch[p.matchId].push(p);
  });

  return (
    <PalpitesClient
      user={userData}
      predictions={filteredPredictions}
      tournaments={formattedTournaments}
      currentRounds={seasonMap}
      otherPredictionsByMatch={otherPredictionsByMatch}
    />
  );
}
