import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PartidasClient } from "./partidas-client";
import type { MatchData, MatchTournament, MatchSeason, PredictionMap } from "@/components/matches/types";

export default async function PartidasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type UserRowT = { id: string; username: string; firebase_id: string | null; role: string };
  type ProfileT = {
    first_name: string;
    last_name: string | null;
    total_points: number;
    level: number;
    xp: number;
    predictions_count: number;
    correct_predictions: number;
    exact_score_predictions: number;
  };

  const [
    userRowResult,
    profileResult,
    tournamentsResult,
    seasonsResult,
    upcomingResult,
    finishedResult,
    rankingResult,
    predictionsResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, firebase_id, role")
      .eq("id", user.id)
      .single(),

    supabase
      .from("user_profiles")
      .select("first_name, last_name, total_points, level, xp, predictions_count, correct_predictions, exact_score_predictions")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tournaments")
      .select("id, name, slug, logo_url, format, has_rounds, sofascore_id")
      .order("display_order", { ascending: true }),

    supabase
      .from("tournament_seasons")
      .select("id, tournament_id, year, is_current, current_round_number, sofascore_season_id")
      .eq("is_current", true),

    supabase
      .from("upcoming_matches")
      .select("id, slug, start_time, status, round_number, round_name, tournament_id, tournament_name, tournament_logo, season_id, home_team_id, home_team_name, home_team_code, home_team_logo, away_team_id, away_team_name, away_team_code, away_team_logo, venue_name, venue_city, predictions_count")
      .order("start_time", { ascending: true }),

    supabase
      .from("recent_results")
      .select("id, slug, start_time, status, round_number, round_name, home_score, away_score, tournament_id, tournament_name, tournament_logo, home_team_id, home_team_name, home_team_code, home_team_logo, away_team_id, away_team_name, away_team_code, away_team_logo, total_predictions, exact_scores, correct_results, accuracy_rate")
      .order("start_time", { ascending: false })
      .limit(100),

    supabase
      .from("global_ranking")
      .select("id, rank")
      .eq("id", user.id)
      .single(),

    supabase
      .from("predictions")
      .select("match_id, home_team_goals, away_team_goals, points_earned, is_exact_score, is_correct_result")
      .eq("user_id", user.id),
  ]);

  const userRow = userRowResult.data;
  const profile = profileResult.data;

  if (!userRow || !profile) {
    redirect("/login");
  }

  const u = userRow as UserRowT;
  const p = profile as ProfileT;

  type TournamentRow = {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    format: string;
    has_rounds: boolean;
    sofascore_id: number | null;
  };

  type SeasonRow = {
    id: string;
    tournament_id: string;
    year: string | null;
    is_current: boolean;
    current_round_number: number | null;
    sofascore_season_id: number | null;
  };

  type UpcomingRow = {
    id: string;
    slug: string;
    start_time: string;
    status: string;
    round_number: number | null;
    round_name: string | null;
    tournament_id: string;
    tournament_name: string;
    tournament_logo: string | null;
    season_id: string;
    home_team_id: string;
    home_team_name: string;
    home_team_code: string | null;
    home_team_logo: string | null;
    away_team_id: string;
    away_team_name: string;
    away_team_code: string | null;
    away_team_logo: string | null;
    venue_name: string | null;
    venue_city: string | null;
    predictions_count: number;
  };

  type FinishedRow = {
    id: string;
    slug: string;
    start_time: string;
    status: string;
    round_number: number | null;
    round_name: string | null;
    home_score: number | null;
    away_score: number | null;
    tournament_id: string;
    tournament_name: string;
    tournament_logo: string | null;
    home_team_id: string;
    home_team_name: string;
    home_team_code: string | null;
    home_team_logo: string | null;
    away_team_id: string;
    away_team_name: string;
    away_team_code: string | null;
    away_team_logo: string | null;
    total_predictions: number;
    exact_scores: number;
    correct_results: number;
    accuracy_rate: number;
  };

  const tournaments: MatchTournament[] = ((tournamentsResult.data as TournamentRow[] | null) || []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    logo_url: t.logo_url,
    format: t.format,
    has_rounds: t.has_rounds,
    sofascore_id: t.sofascore_id,
  }));

  const seasons: MatchSeason[] = ((seasonsResult.data as SeasonRow[] | null) || []).map((s) => ({
    id: s.id,
    tournament_id: s.tournament_id,
    year: s.year,
    is_current: s.is_current,
    current_round_number: s.current_round_number,
    sofascore_season_id: s.sofascore_season_id,
  }));

  const upcomingRows = (upcomingResult.data as UpcomingRow[] | null) || [];
  const finishedRows = (finishedResult.data as FinishedRow[] | null) || [];

  const upcomingMatches: MatchData[] = upcomingRows.map((m) => ({
    id: m.id,
    slug: m.slug,
    tournament_id: m.tournament_id,
    season_id: m.season_id,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    round_number: m.round_number,
    round_name: m.round_name,
    start_time: m.start_time,
    status: m.status,
    home_score: null,
    away_score: null,
    tournament_name: m.tournament_name,
    tournament_logo: m.tournament_logo,
    home_team_name: m.home_team_name,
    home_team_code: m.home_team_code,
    home_team_logo: m.home_team_logo,
    away_team_name: m.away_team_name,
    away_team_code: m.away_team_code,
    away_team_logo: m.away_team_logo,
    venue_name: m.venue_name,
    venue_city: m.venue_city,
    predictions_count: m.predictions_count,
  }));

  const finishedMatches: MatchData[] = finishedRows.map((m) => ({
    id: m.id,
    slug: m.slug,
    tournament_id: m.tournament_id,
    season_id: "",
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    round_number: m.round_number,
    round_name: m.round_name,
    start_time: m.start_time,
    status: m.status,
    home_score: m.home_score,
    away_score: m.away_score,
    tournament_name: m.tournament_name,
    tournament_logo: m.tournament_logo,
    home_team_name: m.home_team_name,
    home_team_code: m.home_team_code,
    home_team_logo: m.home_team_logo,
    away_team_name: m.away_team_name,
    away_team_code: m.away_team_code,
    away_team_logo: m.away_team_logo,
    total_predictions: m.total_predictions,
    exact_scores: m.exact_scores,
    correct_results: m.correct_results,
    accuracy_rate: m.accuracy_rate,
  }));

  type PredictionRow = {
    match_id: string;
    home_team_goals: number;
    away_team_goals: number;
    points_earned: number | null;
    is_exact_score: boolean | null;
    is_correct_result: boolean | null;
  };

  const userPredictions = (predictionsResult.data as PredictionRow[] | null) || [];

  const predictionsMap: PredictionMap = {};
  userPredictions.forEach((pred) => {
    predictionsMap[String(pred.match_id)] = {
      homeScore: pred.home_team_goals,
      awayScore: pred.away_team_goals,
      pointsEarned: pred.points_earned ?? undefined,
      isExactScore: pred.is_exact_score ?? undefined,
      isCorrectResult: pred.is_correct_result ?? undefined,
    };
  });

  type RankRow = { id: string; rank: number };
  const currentRank = (rankingResult.data as RankRow | null)?.rank ?? 0;

  const userName = `${p.first_name}${p.last_name ? ` ${p.last_name}` : ""}`;

  const userData = {
    id: u.firebase_id || user.id,
    supabaseId: user.id,
    name: userName,
    points: p.total_points || 0,
    level: p.level || 1,
    xp: p.xp || 0,
    role: u.role as "user" | "admin",
    predictionsCount: p.predictions_count || 0,
    correctPredictions: p.correct_predictions || 0,
    exactScorePredictions: p.exact_score_predictions || 0,
    currentRank,
  };

  return (
    <PartidasClient
      user={userData}
      tournaments={tournaments}
      seasons={seasons}
      upcomingMatches={upcomingMatches}
      finishedMatches={finishedMatches}
      initialPredictions={predictionsMap}
    />
  );
}
