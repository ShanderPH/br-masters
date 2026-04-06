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

  type UserRowT = { id: string; firebase_id: string | null; role: string };
  type ProfileT = { first_name: string; last_name: string | null; total_points: number; level: number; xp: number };
  type GenProfileRow = { id: string; first_name: string; last_name: string | null; total_points: number; predictions_count: number };
  type TournamentRow = { id: string; name: string; slug: string; logo_url: string | null };
  type TPRow = { user_id: string; points_earned: number; matches: { tournament_id: string } };
  type RoundTPRow = { user_id: string; points_earned: number; matches: { tournament_id: string; round_number: number | null } };

  const [
    userRowResult,
    profileResult,
    generalProfilesResult,
    tournamentsResult,
    tournamentPredsResult,
    roundPredsResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, firebase_id, role")
      .eq("id", user.id)
      .single(),

    supabase
      .from("user_profiles")
      .select("first_name, last_name, total_points, level, xp")
      .eq("id", user.id)
      .single(),

    supabase
      .from("user_profiles")
      .select("id, first_name, last_name, total_points, predictions_count")
      .gt("total_points", 0)
      .order("total_points", { ascending: false })
      .limit(50),

    supabase
      .from("tournaments")
      .select("id, name, slug, logo_url")
      .order("display_order", { ascending: true }),

    (process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase)
      .from("predictions")
      .select("user_id, points_earned, matches!inner(tournament_id)")
      .gt("points_earned", 0),

    (process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase)
      .from("predictions")
      .select("user_id, points_earned, matches!inner(tournament_id, round_number)")
      .gt("points_earned", 0),
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

  const tournamentPointsAgg: Map<string, Map<string, number>> = new Map();
  tpRows.forEach((tp) => {
    const tournamentId = tp.matches.tournament_id;
    if (!tournamentPointsAgg.has(tournamentId)) {
      tournamentPointsAgg.set(tournamentId, new Map());
    }
    const userMap = tournamentPointsAgg.get(tournamentId)!;
    userMap.set(tp.user_id, (userMap.get(tp.user_id) || 0) + (tp.points_earned || 0));
  });

  // Fetch profiles for any users in tournament predictions not already in genProfiles
  const genProfileMap = new Map(genProfiles.map((p) => [p.id, p]));
  const allTpUserIds = [...new Set(tpRows.map((tp) => tp.user_id))];
  const missingUserIds = allTpUserIds.filter((id) => !genProfileMap.has(id));
  if (missingUserIds.length > 0) {
    const { data: missingProfiles } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, total_points, predictions_count")
      .in("id", missingUserIds);
    type GenProfileRow2 = { id: string; first_name: string; last_name: string | null; total_points: number; predictions_count: number };
    ((missingProfiles as GenProfileRow2[] | null) || []).forEach((p) => genProfileMap.set(p.id, p));
  }

  // Fetch team logos for any users in tournament predictions not already in genTeamsMap
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

  const formattedGeneralRanking = genProfiles.map((p) => ({
    id: p.id,
    name: `${p.first_name}${p.last_name ? ` ${p.last_name}` : ""}`,
    points: p.total_points || 0,
    predictions: p.predictions_count || 0,
    exactScores: 0,
    accuracy: 0,
    favoriteTeamLogo: genTeamsMap.get(p.id) ?? null,
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

  tournamentPointsAgg.forEach((userMap, tournamentId) => {
    const entries = [...userMap.entries()]
      .filter(([, points]) => points > 0)
      .sort((a, b) => b[1] - a[1]);
    tournamentRankings[tournamentId] = entries.map(([userId, points]) => {
      const gp = genProfileMap.get(userId);
      return {
        id: userId,
        name: gp ? `${gp.first_name}${gp.last_name ? ` ${gp.last_name}` : ""}` : "Jogador",
        points,
        predictions: gp?.predictions_count || 0,
        exactScores: 0,
        accuracy: 0,
        favoriteTeamLogo: genTeamsMap.get(userId) ?? null,
        currentRank: null,
        previousRank: null,
      };
    });
  });

  // Build per-round rankings: roundRankings[tournamentId][roundNumber] = players[]
  // roundPointsAgg: tournamentId → roundNumStr → userId → totalPoints
  const roundPointsAgg = new Map<string, Map<string, Map<string, number>>>();
  roundTpRows.forEach((rp) => {
    const tId = rp.matches.tournament_id;
    const rNum = rp.matches.round_number;
    if (rNum === null || rNum === undefined) return;
    const rKey = String(rNum);
    if (!roundPointsAgg.has(tId)) roundPointsAgg.set(tId, new Map());
    const byRound = roundPointsAgg.get(tId)!;
    if (!byRound.has(rKey)) byRound.set(rKey, new Map());
    const byUser = byRound.get(rKey)!;
    byUser.set(rp.user_id, (byUser.get(rp.user_id) || 0) + (rp.points_earned || 0));
  });

  const roundRankings: Record<string, Record<number, Array<{
    id: string; name: string; points: number; predictions: number;
    exactScores: number; accuracy: number; favoriteTeamLogo: string | null;
  }>>> = {};

  roundPointsAgg.forEach((byRound, tId) => {
    roundRankings[tId] = {};
    byRound.forEach((byUser, rKey) => {
      const rNum = Number(rKey);
      const entries = [...byUser.entries()]
        .filter(([, pts]) => pts > 0)
        .sort(([, a], [, b]) => b - a);
      roundRankings[tId][rNum] = entries.map(([userId, pts]) => {
        const gp = genProfileMap.get(userId);
        return {
          id: userId,
          name: gp ? `${gp.first_name}${gp.last_name ? ` ${gp.last_name}` : ""}` : "Jogador",
          points: pts,
          predictions: gp?.predictions_count || 0,
          exactScores: 0,
          accuracy: 0,
          favoriteTeamLogo: genTeamsMap.get(userId) ?? null,
        };
      });
    });
  });

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
      generalRanking={formattedGeneralRanking}
      tournamentRankings={tournamentRankings}
      roundRankings={roundRankings}
      tournaments={formattedTournaments}
    />
  );
}
