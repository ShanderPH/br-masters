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

  type VisiblePredictionRow = {
    user_id: string;
    match_id: string;
    home_team_goals: number;
    away_team_goals: number;
    points_earned: number | null;
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

  const seasonFallbackMap: Record<string, number> = {};
  seasonsList.forEach((s) => {
    if (s.current_round_number) {
      seasonFallbackMap[String(s.tournament_id)] = s.current_round_number;
    }
  });

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
    home_team: { name: string; name_code: string | null; logo_url: string | null } | null;
    away_team: { name: string; name_code: string | null; logo_url: string | null } | null;
  };

  const activeTournamentIds = new Set(tournamentsList.map((t) => String(t.id)));
  const activeTournamentIdsList = Array.from(activeTournamentIds);

  let matchesData: MatchDataRow[] = [];
  if (activeTournamentIdsList.length > 0) {
    const { data: mData } = await supabase
      .from("matches")
      .select("id, round_number, home_team_id, away_team_id, start_time, status, home_score, away_score, tournament_id, home_team:teams!matches_home_team_id_fkey(name, name_code, logo_url), away_team:teams!matches_away_team_id_fkey(name, name_code, logo_url)")
      .in("tournament_id", activeTournamentIdsList)
      .is("deleted_at", null);
    matchesData = (mData as MatchDataRow[] | null) || [];
  }

  const seasonMap: Record<string, number> = {};
  for (const tournamentId of activeTournamentIdsList) {
    const tournamentMatches = matchesData.filter((m) => String(m.tournament_id) === String(tournamentId));

    if (tournamentMatches.length === 0) {
      seasonMap[tournamentId] = seasonFallbackMap[tournamentId] || 1;
      continue;
    }

    const roundStats = new Map<number, { total: number; finished: number; live: number; scheduled: number }>();

    for (const m of tournamentMatches) {
      if (typeof m.round_number !== "number") continue;
      const rn = m.round_number;
      if (!roundStats.has(rn)) {
        roundStats.set(rn, { total: 0, finished: 0, live: 0, scheduled: 0 });
      }
      const stats = roundStats.get(rn)!;
      stats.total++;
      if (m.status === "finished") stats.finished++;
      else if (m.status === "live") stats.live++;
      else if (m.status === "scheduled") stats.scheduled++;
    }

    const sortedRounds = Array.from(roundStats.keys()).sort((a, b) => a - b);

    if (sortedRounds.length === 0) {
      seasonMap[tournamentId] = seasonFallbackMap[tournamentId] || 1;
      continue;
    }

    let computedCurrentRound = sortedRounds[0];

    for (const rn of sortedRounds) {
      const stats = roundStats.get(rn)!;

      if (stats.live > 0) {
        computedCurrentRound = rn;
        break;
      }

      if (stats.scheduled > 0 && stats.finished < stats.total) {
        computedCurrentRound = rn;
        break;
      }

      if (stats.finished === stats.total) {
        computedCurrentRound = rn + 1;
      }
    }

    const maxRound = Math.max(...sortedRounds);
    seasonMap[tournamentId] = Math.min(computedCurrentRound, maxRound);
  }

  const matchIds = matchesData.map((m) => m.id);
  let visiblePredictionRows: VisiblePredictionRow[] = [];

  if (matchIds.length > 0) {
    const { data: visiblePreds } = await supabase
      .from("predictions")
      .select("user_id, match_id, home_team_goals, away_team_goals, points_earned, is_correct_result, is_exact_score, predicted_at")
      .in("match_id", matchIds)
      .order("predicted_at", { ascending: false });

    visiblePredictionRows = (visiblePreds as VisiblePredictionRow[] | null) || [];
  }

  const discoverableMatchIds = new Set(visiblePredictionRows.map((p) => String(p.match_id)));
  const matchMap = new Map(matchesData.map((m) => [String(m.id), m]));
  const myPredictionsByMatch = new Map(predictionRows.map((p) => [String(p.match_id), p]));

  const formattedPredictions = Array.from(discoverableMatchIds)
    .map((matchId) => {
      const match = matchMap.get(matchId);
      if (!match) return null;

      const ownPrediction = myPredictionsByMatch.get(matchId);

      return {
        id: match.id,
        matchId,
        userPrediction: ownPrediction
          ? {
              id: ownPrediction.id,
              homeTeamGoals: ownPrediction.home_team_goals,
              awayTeamGoals: ownPrediction.away_team_goals,
              pointsEarned: ownPrediction.points_earned || 0,
              isCorrect: ownPrediction.is_correct_result || false,
              isExactScore: ownPrediction.is_exact_score || false,
              predictedAt: ownPrediction.predicted_at,
            }
          : null,
        tournamentId: String(match.tournament_id),
        roundNumber: match.round_number || 0,
        match: {
          id: match.id,
          homeTeamName: match.home_team?.name || "TBD",
          homeTeamShortName: match.home_team?.name_code || null,
          homeTeamLogo: match.home_team?.logo_url || null,
          awayTeamName: match.away_team?.name || "TBD",
          awayTeamShortName: match.away_team?.name_code || null,
          awayTeamLogo: match.away_team?.logo_url || null,
          startTime: match.start_time,
          status: match.status,
          homeScore: match.home_score,
          awayScore: match.away_score,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.match.startTime).getTime() - new Date(a!.match.startTime).getTime()) as Array<{
    id: string;
    matchId: string;
    userPrediction: {
      id: string;
      homeTeamGoals: number;
      awayTeamGoals: number;
      pointsEarned: number;
      isCorrect: boolean;
      isExactScore: boolean;
      predictedAt: string;
    } | null;
    tournamentId: string;
    roundNumber: number;
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
    const otherPredRows = visiblePredictionRows
      .filter((p) => allMatchIdsForOthers.includes(String(p.match_id)))
      .filter((p) => p.user_id !== user.id);

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

        return {
          matchId: String(p.match_id),
          oddsUserId: p.user_id,
          userName: name,
          userTeamLogo: teamLogo,
          homeTeamGoals: p.home_team_goals,
          awayTeamGoals: p.away_team_goals,
          pointsEarned: p.points_earned || 0,
          isCorrect: p.is_correct_result || false,
          isExactScore: p.is_exact_score || false,
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
