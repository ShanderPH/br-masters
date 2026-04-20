import { redirect } from "next/navigation";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { RankingClient } from "./ranking-client";

export default async function RankingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type UserRowT = { id: string; firebase_id: string | null; role: string; favorite_team_id: string | null };
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
  type GenProfileRow = {
    id: string;
    first_name: string;
    last_name: string | null;
    total_points: number;
    predictions_count: number;
    correct_predictions: number;
    exact_score_predictions: number;
  };
  type TournamentRow = { id: string; name: string; slug: string; logo_url: string | null };
  type TPRow = { user_id: string; points_earned: number; is_exact_score: boolean | null; matches: { tournament_id: string } };
  type RoundTPRow = {
    user_id: string;
    points_earned: number;
    is_exact_score: boolean | null;
    matches: { tournament_id: string; round_number: number | null };
  };
  type UserFullPredRow = {
    points_earned: number;
    is_exact_score: boolean | null;
    is_correct_result: boolean | null;
    matches: { tournament_id: string; round_number: number | null };
  };

  const [
    userRowResult,
    profileResult,
    generalProfilesResult,
    tournamentsResult,
    tournamentPredsResult,
    roundPredsResult,
    userFullPredsResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, firebase_id, role, favorite_team_id")
      .eq("id", user.id)
      .single(),

    supabase
      .from("user_profiles")
      .select("first_name, last_name, total_points, level, xp, predictions_count, correct_predictions, exact_score_predictions")
      .eq("id", user.id)
      .single(),

    supabase
      .from("user_profiles")
      .select("id, first_name, last_name, total_points, predictions_count, correct_predictions, exact_score_predictions")
      .gt("total_points", 0)
      .order("total_points", { ascending: false })
      .limit(50),

    supabase
      .from("tournaments")
      .select("id, name, slug, logo_url")
      .order("display_order", { ascending: true }),

    (process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase)
      .from("predictions")
      .select("user_id, points_earned, is_exact_score, matches!inner(tournament_id)")
      .gt("points_earned", 0),

    (process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase)
      .from("predictions")
      .select("user_id, points_earned, is_exact_score, matches!inner(tournament_id, round_number)")
      .gt("points_earned", 0),

    // All current user's predictions (including 0-point misses) for accurate per-context stats
    (process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase)
      .from("predictions")
      .select("points_earned, is_exact_score, is_correct_result, matches!inner(tournament_id, round_number)")
      .eq("user_id", user.id),
  ]);

  const userRow = userRowResult.data;
  const profile = profileResult.data;

  if (!userRow || !profile) {
    redirect("/login");
  }

  const ur = userRow as UserRowT;
  const pr = profile as ProfileT;
  const genProfiles = (generalProfilesResult.data as GenProfileRow[] | null) || [];
  const tournamentsList = (tournamentsResult.data as TournamentRow[] | null) || [];
  const tpRows = (tournamentPredsResult.data as TPRow[] | null) || [];
  const roundTpRows = (roundPredsResult.data as RoundTPRow[] | null) || [];
  const userFullPreds = (userFullPredsResult.data as UserFullPredRow[] | null) || [];

  // --- Current user's favorite team (for share card theming) ---
  let favoriteTeam: { id: string; name: string; slug: string; primaryColor: string | null; secondaryColor: string | null; logoUrl: string | null } | null = null;
  if (ur.favorite_team_id) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, slug, primary_color, secondary_color, logo_url")
      .eq("id", ur.favorite_team_id)
      .single();
    type TeamRow = { id: string; name: string; slug: string; primary_color: string | null; secondary_color: string | null; logo_url: string | null };
    const t = teamData as TeamRow | null;
    if (t) {
      favoriteTeam = {
        id: t.id,
        name: t.name,
        slug: t.slug,
        primaryColor: t.primary_color,
        secondaryColor: t.secondary_color,
        logoUrl: t.logo_url,
      };
    }
  }

  // --- Team-logo lookup for top-50 ranked users ---
  const allGenUserIds = genProfiles.map((p) => p.id);
  const genTeamsMap: Map<string, string | null> = new Map();
  if (allGenUserIds.length > 0) {
    const { data: genUsersData } = await supabase.from("users").select("id, favorite_team_id").in("id", allGenUserIds);
    type GUR = { id: string; favorite_team_id: string | null };
    const genUsers = (genUsersData as GUR[] | null) || [];
    const teamIds = [...new Set(genUsers.map((u) => u.favorite_team_id).filter(Boolean))] as string[];
    if (teamIds.length > 0) {
      const { data: td } = await supabase.from("teams").select("id, logo_url").in("id", teamIds);
      type TR = { id: string; logo_url: string | null };
      const teamsLookup = new Map(((td as TR[] | null) || []).map((t) => [t.id, t.logo_url]));
      genUsers.forEach((u) => {
        genTeamsMap.set(u.id, u.favorite_team_id ? teamsLookup.get(u.favorite_team_id) ?? null : null);
      });
    }
  }

  // --- Aggregate tournament points + exact scores per user per tournament ---
  type TAgg = { points: number; exact: number };
  const tournamentAgg: Map<string, Map<string, TAgg>> = new Map();
  tpRows.forEach((tp) => {
    const tournamentId = tp.matches.tournament_id;
    if (!tournamentAgg.has(tournamentId)) tournamentAgg.set(tournamentId, new Map());
    const userMap = tournamentAgg.get(tournamentId)!;
    const cur = userMap.get(tp.user_id) || { points: 0, exact: 0 };
    cur.points += tp.points_earned || 0;
    if (tp.is_exact_score) cur.exact += 1;
    userMap.set(tp.user_id, cur);
  });

  // Hydrate profiles for users in tournament predictions but outside top-50 general ranking
  const genProfileMap = new Map(genProfiles.map((p) => [p.id, p]));
  const allTpUserIds = [...new Set(tpRows.map((tp) => tp.user_id))];
  const missingUserIds = allTpUserIds.filter((id) => !genProfileMap.has(id));
  if (missingUserIds.length > 0) {
    const { data: missingProfiles } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, total_points, predictions_count, correct_predictions, exact_score_predictions")
      .in("id", missingUserIds);
    ((missingProfiles as GenProfileRow[] | null) || []).forEach((p) => genProfileMap.set(p.id, p));
  }

  // Hydrate team logos for the same set
  const missingTeamUserIds = allTpUserIds.filter((id) => !genTeamsMap.has(id));
  if (missingTeamUserIds.length > 0) {
    const { data: extraUsersData } = await supabase.from("users").select("id, favorite_team_id").in("id", missingTeamUserIds);
    type GUR2 = { id: string; favorite_team_id: string | null };
    const extraUsers = (extraUsersData as GUR2[] | null) || [];
    const extraTeamIds = [...new Set(extraUsers.map((u) => u.favorite_team_id).filter(Boolean))] as string[];
    if (extraTeamIds.length > 0) {
      const { data: etd } = await supabase.from("teams").select("id, logo_url").in("id", extraTeamIds);
      type TR2 = { id: string; logo_url: string | null };
      const extraTeamsLookup = new Map(((etd as TR2[] | null) || []).map((t) => [t.id, t.logo_url]));
      extraUsers.forEach((u) => {
        genTeamsMap.set(u.id, u.favorite_team_id ? extraTeamsLookup.get(u.favorite_team_id) ?? null : null);
      });
    } else {
      extraUsers.forEach((u) => genTeamsMap.set(u.id, null));
    }
  }

  const userName = `${pr.first_name}${pr.last_name ? ` ${pr.last_name}` : ""}`;

  const userData = {
    id: ur.firebase_id || user.id,
    name: userName || "Jogador",
    points: pr.total_points || 0,
    level: pr.level || 1,
    xp: pr.xp || 0,
    role: (ur.role || "user") as "user" | "admin",
  };

  const generalAccuracy = pr.predictions_count > 0
    ? Math.round(((pr.correct_predictions + pr.exact_score_predictions) / pr.predictions_count) * 100)
    : 0;

  const formattedGeneralRanking = genProfiles.map((p) => {
    const total = p.predictions_count || 0;
    const correct = (p.correct_predictions || 0) + (p.exact_score_predictions || 0);
    return {
      id: p.id,
      name: `${p.first_name}${p.last_name ? ` ${p.last_name}` : ""}`,
      points: p.total_points || 0,
      predictions: total,
      exactScores: p.exact_score_predictions || 0,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      favoriteTeamLogo: genTeamsMap.get(p.id) ?? null,
    };
  });

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

  tournamentAgg.forEach((userMap, tournamentId) => {
    const entries = [...userMap.entries()]
      .filter(([, agg]) => agg.points > 0)
      .sort((a, b) => b[1].points - a[1].points);
    tournamentRankings[tournamentId] = entries.map(([userId, agg]) => {
      const gp = genProfileMap.get(userId);
      return {
        id: userId,
        name: gp ? `${gp.first_name}${gp.last_name ? ` ${gp.last_name}` : ""}` : "Jogador",
        points: agg.points,
        predictions: gp?.predictions_count || 0,
        exactScores: agg.exact,
        accuracy: 0,
        favoriteTeamLogo: genTeamsMap.get(userId) ?? null,
        currentRank: null,
        previousRank: null,
      };
    });
  });

  // Per-round rankings: roundRankings[tournamentId][roundNumber] = players[]
  type RAgg = { points: number; exact: number };
  const roundAgg = new Map<string, Map<string, Map<string, RAgg>>>();
  roundTpRows.forEach((rp) => {
    const tId = rp.matches.tournament_id;
    const rNum = rp.matches.round_number;
    if (rNum === null || rNum === undefined) return;
    const rKey = String(rNum);
    if (!roundAgg.has(tId)) roundAgg.set(tId, new Map());
    const byRound = roundAgg.get(tId)!;
    if (!byRound.has(rKey)) byRound.set(rKey, new Map());
    const byUser = byRound.get(rKey)!;
    const cur = byUser.get(rp.user_id) || { points: 0, exact: 0 };
    cur.points += rp.points_earned || 0;
    if (rp.is_exact_score) cur.exact += 1;
    byUser.set(rp.user_id, cur);
  });

  const roundRankings: Record<string, Record<number, Array<{
    id: string; name: string; points: number; predictions: number;
    exactScores: number; accuracy: number; favoriteTeamLogo: string | null;
  }>>> = {};

  roundAgg.forEach((byRound, tId) => {
    roundRankings[tId] = {};
    byRound.forEach((byUser, rKey) => {
      const rNum = Number(rKey);
      const entries = [...byUser.entries()]
        .filter(([, agg]) => agg.points > 0)
        .sort(([, a], [, b]) => b.points - a.points);
      roundRankings[tId][rNum] = entries.map(([userId, agg]) => {
        const gp = genProfileMap.get(userId);
        return {
          id: userId,
          name: gp ? `${gp.first_name}${gp.last_name ? ` ${gp.last_name}` : ""}` : "Jogador",
          points: agg.points,
          predictions: gp?.predictions_count || 0,
          exactScores: agg.exact,
          accuracy: 0,
          favoriteTeamLogo: genTeamsMap.get(userId) ?? null,
        };
      });
    });
  });

  // --- Current user's per-context stats (built from their full predictions list) ---
  type Stats = { points: number; predictions: number; exactScores: number; correctPredictions: number; accuracy: number };

  const emptyStats = (): Stats => ({ points: 0, predictions: 0, exactScores: 0, correctPredictions: 0, accuracy: 0 });

  const tournamentStats: Record<string, Stats> = {};
  const roundStats: Record<string, Record<number, Stats>> = {};

  userFullPreds.forEach((p) => {
    const tId = p.matches.tournament_id;
    const rNum = p.matches.round_number;
    if (!tournamentStats[tId]) tournamentStats[tId] = emptyStats();
    const ts = tournamentStats[tId];
    ts.points += p.points_earned || 0;
    ts.predictions += 1;
    if (p.is_exact_score) ts.exactScores += 1;
    if (p.is_correct_result || p.is_exact_score) ts.correctPredictions += 1;

    if (rNum !== null && rNum !== undefined) {
      if (!roundStats[tId]) roundStats[tId] = {};
      if (!roundStats[tId][rNum]) roundStats[tId][rNum] = emptyStats();
      const rs = roundStats[tId][rNum];
      rs.points += p.points_earned || 0;
      rs.predictions += 1;
      if (p.is_exact_score) rs.exactScores += 1;
      if (p.is_correct_result || p.is_exact_score) rs.correctPredictions += 1;
    }
  });

  // Finalize accuracy
  Object.values(tournamentStats).forEach((s) => {
    s.accuracy = s.predictions > 0 ? Math.round((s.correctPredictions / s.predictions) * 100) : 0;
  });
  Object.values(roundStats).forEach((rounds) => {
    Object.values(rounds).forEach((s) => {
      s.accuracy = s.predictions > 0 ? Math.round((s.correctPredictions / s.predictions) * 100) : 0;
    });
  });

  const generalStats: Stats = {
    points: pr.total_points || 0,
    predictions: pr.predictions_count || 0,
    exactScores: pr.exact_score_predictions || 0,
    correctPredictions: (pr.correct_predictions || 0) + (pr.exact_score_predictions || 0),
    accuracy: generalAccuracy,
  };

  const currentUserStats = {
    general: generalStats,
    tournaments: tournamentStats,
    rounds: roundStats,
  };

  const tournamentsWithData = tournamentsList.filter((t) =>
    tournamentRankings[t.id]?.length > 0
  );

  const formattedTournaments = tournamentsWithData.map((t) => ({
    id: t.id,
    name: t.name,
    logo: t.logo_url || "/images/brasileirao-logo.svg",
  }));

  return (
    <RankingClient
      user={userData}
      currentUserAuthId={user.id}
      currentUserTeam={favoriteTeam}
      currentUserStats={currentUserStats}
      generalRanking={formattedGeneralRanking}
      tournamentRankings={tournamentRankings}
      roundRankings={roundRankings}
      tournaments={formattedTournaments}
    />
  );
}
