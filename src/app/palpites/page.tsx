import { redirect } from "next/navigation";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PalpitesClient } from "./palpites-client";

export default async function PalpitesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type UserRowT = { id: string; username: string; firebase_id: string | null; role: string; favorite_team_id: string | null };
  type ProfileT = { first_name: string; last_name: string | null; total_points: number; level: number; xp: number };
  type TournamentRow = { id: string; name: string; slug: string; logo_url: string | null };
  type SeasonRow = { id: string; tournament_id: string; current_round_number: number | null };
  type PredictionRow = {
    id: string;
    match_id: string;
    home_team_goals: number;
    away_team_goals: number;
    points_earned: number;
    is_correct_result: boolean | null;
    is_exact_score: boolean | null;
    predicted_at: string;
  };

  const [
    userRowResult,
    profileResult,
    tournamentsResult,
    seasonsResult,
    predictionsResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, firebase_id, role, favorite_team_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_profiles")
      .select("first_name, last_name, total_points, level, xp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tournaments")
      .select("id, name, slug, logo_url")
      .order("display_order", { ascending: true }),
    supabase
      .from("tournament_seasons")
      .select("id, tournament_id, current_round_number")
      .eq("is_current", true),
    supabase
      .from("predictions")
      .select("id, match_id, home_team_goals, away_team_goals, points_earned, is_correct_result, is_exact_score, predicted_at")
      .eq("user_id", user.id)
      .order("predicted_at", { ascending: false }),
  ]);

  const userRow = userRowResult.data;
  const profile = profileResult.data;

  if (!userRow || !profile) {
    redirect("/login");
  }

  const ur = userRow as UserRowT;
  const pr = profile as ProfileT;
  const tournamentsList = (tournamentsResult.data as TournamentRow[] | null) || [];
  const seasonsList = (seasonsResult.data as SeasonRow[] | null) || [];
  const predictionRows = (predictionsResult.data as PredictionRow[] | null) || [];

  const seasonMap: Record<string, number> = {};
  seasonsList.forEach((s) => {
    if (s.current_round_number) {
      seasonMap[String(s.tournament_id)] = s.current_round_number;
    }
  });

  const matchIds = predictionRows.map((p) => p.match_id);

  type MatchDataRow = {
    id: string;
    round_number: number | null;
    home_team_id: string;
    away_team_id: string;
    start_time: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
    tournament_id: string;
  };

  let matchesData: MatchDataRow[] = [];

  if (matchIds.length > 0) {
    const { data: mData } = await supabase
      .from("matches")
      .select("id, round_number, home_team_id, away_team_id, start_time, status, home_score, away_score, tournament_id")
      .in("id", matchIds);

    matchesData = (mData as MatchDataRow[]) || [];
  }

  const allTeamIds = [...new Set(matchesData.flatMap((m) => [m.home_team_id, m.away_team_id]))];
  let teamsMap: Map<string, { name: string; name_code: string; logo_url: string | null }> = new Map();
  if (allTeamIds.length > 0) {
    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name, name_code, logo_url")
      .in("id", allTeamIds);
    type TeamRow = { id: string; name: string; name_code: string; logo_url: string | null };
    const teamRows = (teamsData as TeamRow[] | null) || [];
    teamsMap = new Map(teamRows.map((t) => [t.id, { name: t.name, name_code: t.name_code, logo_url: t.logo_url }]));
  }

  const matchMap = new Map(matchesData.map((m) => [String(m.id), m]));

  const formattedPredictions = predictionRows
    .map((p) => {
      const match = matchMap.get(String(p.match_id));
      if (!match) return null;

      const homeTeam = teamsMap.get(match.home_team_id);
      const awayTeam = teamsMap.get(match.away_team_id);

      return {
        id: p.id,
        matchId: String(p.match_id),
        homeTeamGoals: p.home_team_goals,
        awayTeamGoals: p.away_team_goals,
        pointsEarned: p.points_earned || 0,
        isCorrect: p.is_correct_result || false,
        isExactScore: p.is_exact_score || false,
        tournamentId: String(match.tournament_id),
        roundNumber: match.round_number || 0,
        predictedAt: p.predicted_at,
        match: {
          id: match.id,
          homeTeamName: homeTeam?.name || "TBD",
          homeTeamShortName: homeTeam?.name_code || null,
          homeTeamLogo: homeTeam?.logo_url || null,
          awayTeamName: awayTeam?.name || "TBD",
          awayTeamShortName: awayTeam?.name_code || null,
          awayTeamLogo: awayTeam?.logo_url || null,
          startTime: match.start_time,
          status: match.status,
          homeScore: match.home_score,
          awayScore: match.away_score,
        },
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    matchId: string;
    homeTeamGoals: number;
    awayTeamGoals: number;
    pointsEarned: number;
    isCorrect: boolean;
    isExactScore: boolean;
    tournamentId: string;
    roundNumber: number;
    predictedAt: string;
    match: {
      id: string;
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

  const userName = `${pr.first_name}${pr.last_name ? ` ${pr.last_name}` : ""}`;

  const userData = {
    id: ur.firebase_id || user.id,
    name: userName || "Jogador",
    points: pr.total_points || 0,
    level: pr.level || 1,
    xp: pr.xp || 0,
    role: ur.role as "user" | "admin",
  };

  const activeTournamentIds = new Set(tournamentsList.map((t) => String(t.id)));

  const filteredPredictions = formattedPredictions.filter((p) =>
    activeTournamentIds.has(p.tournamentId)
  );

  const tournamentIdsWithPredictions = new Set(
    filteredPredictions.map((p) => p.tournamentId)
  );

  const tournamentsWithPredictions = tournamentsList.filter((t) =>
    tournamentIdsWithPredictions.has(String(t.id))
  );

  const formattedTournaments = tournamentsWithPredictions.map((t) => ({
    id: String(t.id),
    name: t.name,
    logo: t.logo_url || "/images/brasileirao-logo.svg",
  }));

  const allMatchIdsForOthers = [...new Set(filteredPredictions.map((p) => p.matchId))];

  let allPredictionsForMatches: Array<{
    matchId: string;
    oddsUserId: string;
    userName: string;
    userTeamLogo: string | null;
    homeTeamGoals: number;
    awayTeamGoals: number;
    pointsEarned: number;
    isCorrect: boolean;
    isExactScore: boolean;
  }> = [];

  if (allMatchIdsForOthers.length > 0) {
    // Use service client to bypass RLS — scores are redacted below for non-finished matches
    const serviceDb = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase;
    const { data: otherPreds } = await serviceDb
      .from("predictions")
      .select("match_id, user_id, home_team_goals, away_team_goals, points_earned, is_correct_result, is_exact_score")
      .in("match_id", allMatchIdsForOthers)
      .neq("user_id", user.id);

    type OtherPredRow = {
      match_id: string;
      user_id: string;
      home_team_goals: number;
      away_team_goals: number;
      points_earned: number;
      is_correct_result: boolean | null;
      is_exact_score: boolean | null;
    };

    const otherPredRows = (otherPreds as OtherPredRow[] | null) || [];

    if (otherPredRows.length > 0) {
      const otherUserIds = [...new Set(otherPredRows.map((p) => p.user_id))];

      const [{ data: otherProfiles }, { data: otherUsersData }] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("id, first_name, last_name")
          .in("id", otherUserIds),
        supabase
          .from("users")
          .select("id, favorite_team_id")
          .in("id", otherUserIds),
      ]);

      type OtherProfileRow = { id: string; first_name: string; last_name: string | null };
      const otherProfilesList = (otherProfiles as OtherProfileRow[] | null) || [];
      const otherProfileMap = new Map(otherProfilesList.map((p) => [p.id, p]));

      type OtherUserRow = { id: string; favorite_team_id: string | null };
      const otherUsersRows = (otherUsersData as OtherUserRow[] | null) || [];
      const otherUsersMap = new Map(otherUsersRows.map((u) => [u.id, u.favorite_team_id]));

      const otherTeamIds = [...new Set(otherUsersRows.map((u) => u.favorite_team_id).filter(Boolean))] as string[];
      let otherTeamsMap: Map<string, string | null> = new Map();
      if (otherTeamIds.length > 0) {
        const { data: otherTeams } = await supabase
          .from("teams")
          .select("id, logo_url")
          .in("id", otherTeamIds);
        type OtherTeamRow = { id: string; logo_url: string | null };
        const otherTeamRows = (otherTeams as OtherTeamRow[] | null) || [];
        otherTeamsMap = new Map(otherTeamRows.map((t) => [t.id, t.logo_url]));
      }

      allPredictionsForMatches = otherPredRows.map((p) => {
        const prof = otherProfileMap.get(p.user_id);
        const favTeamId = otherUsersMap.get(p.user_id);
        const teamLogo = favTeamId ? otherTeamsMap.get(favTeamId) ?? null : null;
        const name = prof ? `${prof.first_name}${prof.last_name ? ` ${prof.last_name}` : ""}` : "Jogador";
        // Redact scores for non-finished matches to enforce business rule server-side
        const match = matchMap.get(String(p.match_id));
        const isFinished = match?.status === "finished";

        return {
          matchId: String(p.match_id),
          oddsUserId: p.user_id,
          userName: name,
          userTeamLogo: teamLogo,
          homeTeamGoals: isFinished ? p.home_team_goals : 0,
          awayTeamGoals: isFinished ? p.away_team_goals : 0,
          pointsEarned: isFinished ? (p.points_earned || 0) : 0,
          isCorrect: isFinished ? (p.is_correct_result || false) : false,
          isExactScore: isFinished ? (p.is_exact_score || false) : false,
        };
      });
    }
  }

  const otherPredictionsByMatch: Record<string, typeof allPredictionsForMatches> = {};
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
