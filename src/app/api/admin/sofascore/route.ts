import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "sofascore.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";

interface SofascoreEvent {
  id: number;
  slug: string;
  roundInfo?: { round?: number; name?: string; slug?: string; cupRoundType?: number };
  homeTeam: { id: number; name: string; shortName?: string; nameCode?: string };
  awayTeam: { id: number; name: string; shortName?: string; nameCode?: string };
  startTimestamp: number;
  status: { code: number; description?: string; type?: string };
  homeScore?: { current?: number; display?: number };
  awayScore?: { current?: number; display?: number };
  tournament?: {
    name?: string;
    slug?: string;
    groupName?: string;
    uniqueTournament?: { id: number; name: string; slug?: string };
  };
}

async function sofascoreFetch(path: string) {
  const url = `https://${RAPIDAPI_HOST}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (response.status === 204) return { events: [], seasons: [], standings: [], rounds: [] };

  if (!response.ok) {
    throw new Error(`SofaScore API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchAllEvents(tournamentId: number, seasonId: number): Promise<SofascoreEvent[]> {
  const eventMap = new Map<number, SofascoreEvent>();

  // 1) Fetch PAST matches via get-last-matches
  let pageIndex = 0;
  let hasNext = true;
  while (hasNext && pageIndex < 20) {
    const data = await sofascoreFetch(
      `/tournaments/get-last-matches?tournamentId=${tournamentId}&seasonId=${seasonId}&pageIndex=${pageIndex}`
    );
    const events: SofascoreEvent[] = data.events || [];
    for (const e of events) eventMap.set(e.id, e);
    hasNext = data.hasNextPage === true;
    pageIndex++;
  }

  // 2) Fetch UPCOMING matches via get-next-matches
  pageIndex = 0;
  hasNext = true;
  while (hasNext && pageIndex < 20) {
    const data = await sofascoreFetch(
      `/tournaments/get-next-matches?tournamentId=${tournamentId}&seasonId=${seasonId}&pageIndex=${pageIndex}`
    );
    const events: SofascoreEvent[] = data.events || [];
    for (const e of events) eventMap.set(e.id, e);
    hasNext = data.hasNextPage === true;
    pageIndex++;
  }

  return Array.from(eventMap.values());
}

function mapEventToMatch(e: SofascoreEvent, tournamentId: number, seasonId: number) {
  const isKnockout = !!e.roundInfo?.cupRoundType || !!e.roundInfo?.name;
  const groupName = e.tournament?.groupName || null;

  return {
    id: e.id,
    round_number: e.roundInfo?.round || 0,
    round_name: e.roundInfo?.name || null,
    round_type: isKnockout ? "cup" : "league",
    cup_round_type: e.roundInfo?.cupRoundType || null,
    group_name: groupName,
    home_team_id: e.homeTeam.id,
    home_team_name: e.homeTeam.name,
    home_team_short_name: e.homeTeam.shortName || e.homeTeam.nameCode || null,
    home_team_logo: `/api/team-logo/${e.homeTeam.id}`,
    away_team_id: e.awayTeam.id,
    away_team_name: e.awayTeam.name,
    away_team_short_name: e.awayTeam.shortName || e.awayTeam.nameCode || null,
    away_team_logo: `/api/team-logo/${e.awayTeam.id}`,
    slug: e.slug,
    start_time: new Date(e.startTimestamp * 1000).toISOString(),
    start_timestamp: e.startTimestamp,
    status: e.status.type || "notstarted",
    status_code: e.status.code,
    status_description: e.status.description || null,
    home_score: e.homeScore?.display ?? e.homeScore?.current ?? 0,
    away_score: e.awayScore?.display ?? e.awayScore?.current ?? 0,
    tournament_id: tournamentId,
    tournament_name: e.tournament?.uniqueTournament?.name || e.tournament?.name || "",
    tournament_slug: e.tournament?.uniqueTournament?.slug || e.tournament?.slug || null,
    season_id: seasonId,
    source: "sofascore",
    last_updated: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function determineTournamentFormat(rounds: { round: number; name?: string; slug?: string }[]): string {
  const hasNamedRounds = rounds.some((r) => r.name);
  const hasPlainRounds = rounds.some((r) => !r.name);

  if (hasNamedRounds && hasPlainRounds) return "mixed";
  if (hasNamedRounds) return "knockout";
  return "league";
}

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json({ error: "RAPIDAPI_KEY não configurada" }, { status: 500 });
    }

    const db: DB = supabase;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "search_tournament": {
        const { query } = body;
        const data = await sofascoreFetch(
          `/search/all?query=${encodeURIComponent(query)}`
        );

        const tournaments = (data.results || [])
          .filter((r: { type: string }) => r.type === "uniqueTournament")
          .map((r: { entity: Record<string, unknown> }) => r.entity);

        return NextResponse.json({ tournaments });
      }

      case "setup_tournament": {
        const { tournamentId, seasonId, format: userFormat } = body;

        const seasonsData = await sofascoreFetch(
          `/tournaments/get-seasons?tournamentId=${tournamentId}`
        );
        const seasons: { id: number; name: string; year: string }[] = seasonsData.seasons || [];

        if (seasons.length === 0) {
          return NextResponse.json({ error: "Torneio não encontrado no SofaScore" }, { status: 404 });
        }

        const targetSeason = seasons.find((s) => s.id === seasonId);
        if (!targetSeason) {
          return NextResponse.json({
            error: `Season ID ${seasonId} não encontrado. Seasons disponíveis: ${seasons.slice(0, 5).map(s => `${s.name} (${s.id})`).join(", ")}`,
          }, { status: 404 });
        }

        const roundsData = await sofascoreFetch(
          `/tournaments/get-rounds?tournamentId=${tournamentId}&seasonId=${seasonId}`
        );
        const rounds: { round: number; name?: string; slug?: string }[] = roundsData.rounds || [];
        const currentRound = roundsData.currentRound || null;

        const detectedFormat = determineTournamentFormat(rounds);
        const finalFormat = userFormat || detectedFormat;

        const hasRounds = finalFormat === "league" || finalFormat === "mixed";
        const hasGroups = finalFormat === "mixed";

        const tournamentName = targetSeason.name;

        const tournamentData = {
          id: tournamentId,
          name: tournamentName,
          slug: tournamentName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          format: finalFormat,
          has_rounds: hasRounds,
          has_groups: hasGroups,
          has_playoff_series: false,
          status: "active",
          season_id: seasonId,
          current_phase: currentRound?.name || (currentRound?.round ? `Rodada ${currentRound.round}` : null),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        };

        const { data: upserted, error: tError } = await db
          .from("tournaments")
          .upsert(tournamentData, { onConflict: "id" })
          .select()
          .single();

        if (tError) {
          return NextResponse.json({ error: tError.message }, { status: 500 });
        }

        const seasonRecords = seasons.slice(0, 10).map((s) => ({
          id: s.id,
          tournament_id: tournamentId,
          name: s.name,
          year: s.year || null,
          is_current: s.id === seasonId,
          updated_at: new Date().toISOString(),
        }));

        await db
          .from("tournament_seasons")
          .upsert(seasonRecords, { onConflict: "id" });

        return NextResponse.json({
          tournament: upserted,
          seasons: seasonRecords,
          rounds,
          currentRound,
          detectedFormat,
        });
      }

      case "get_rounds": {
        const { tournamentId, seasonId } = body;

        const data = await sofascoreFetch(
          `/tournaments/get-rounds?tournamentId=${tournamentId}&seasonId=${seasonId}`
        );

        return NextResponse.json({
          rounds: data.rounds || [],
          currentRound: data.currentRound || null,
        });
      }

      case "get_seasons": {
        const { tournamentId } = body;

        const data = await sofascoreFetch(
          `/tournaments/get-seasons?tournamentId=${tournamentId}`
        );

        return NextResponse.json({ seasons: data.seasons || [] });
      }

      case "import_matches": {
        const { tournamentId, seasonId } = body;

        const events = await fetchAllEvents(tournamentId, seasonId);

        if (events.length === 0) {
          return NextResponse.json({ matches: [], count: 0 });
        }

        const matchesData = events.map((e) => mapEventToMatch(e, tournamentId, seasonId));

        const batchSize = 100;
        let totalInserted = 0;

        for (let i = 0; i < matchesData.length; i += batchSize) {
          const batch = matchesData.slice(i, i + batchSize);
          const { error } = await db
            .from("matches")
            .upsert(batch, { onConflict: "id" });

          if (error) {
            return NextResponse.json({
              error: error.message,
              partialCount: totalInserted,
            }, { status: 500 });
          }
          totalInserted += batch.length;
        }

        const groupNames = [...new Set(matchesData.map((m) => m.group_name).filter(Boolean))];
        const roundNames = [...new Set(matchesData.map((m) => m.round_name).filter(Boolean))];
        const roundNumbers = [...new Set(matchesData.map((m) => m.round_number))].sort((a, b) => a - b);
        const pastCount = matchesData.filter((m) => m.status === "finished").length;
        const futureCount = matchesData.filter((m) => m.status === "notstarted").length;

        return NextResponse.json({
          count: matchesData.length,
          pastCount,
          futureCount,
          groups: groupNames,
          roundNames,
          roundNumbers,
        });
      }

      case "import_round_matches": {
        const { tournamentId, seasonId, round } = body;
        if (!round) {
          return NextResponse.json({ error: "Rodada não informada" }, { status: 400 });
        }

        const events = await fetchAllEvents(tournamentId, seasonId);
        const roundEvents = events.filter((e) => e.roundInfo?.round === Number(round));

        if (roundEvents.length === 0) {
          return NextResponse.json({ error: `Nenhuma partida encontrada para rodada ${round}`, count: 0 }, { status: 404 });
        }

        const matchesData = roundEvents.map((e) => mapEventToMatch(e, tournamentId, seasonId));

        const { error } = await db
          .from("matches")
          .upsert(matchesData, { onConflict: "id" });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          count: matchesData.length,
          round: Number(round),
          statuses: [...new Set(matchesData.map((m) => m.status))],
        });
      }

      case "update_match_scores": {
        const { tournamentId, seasonId } = body;

        const events = await fetchAllEvents(tournamentId, seasonId);
        const finishedEvents = events.filter((e) => e.status.type === "finished");

        let updatedCount = 0;

        for (const e of finishedEvents) {
          const { error } = await db
            .from("matches")
            .update({
              status: "finished",
              status_code: e.status.code,
              status_description: e.status.description || "Ended",
              home_score: e.homeScore?.display ?? e.homeScore?.current ?? 0,
              away_score: e.awayScore?.display ?? e.awayScore?.current ?? 0,
              last_updated: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", e.id);

          if (!error) updatedCount++;
        }

        return NextResponse.json({ updated: updatedCount, total: finishedEvents.length });
      }

      case "calculate_scores": {
        const { tournamentId, seasonId, round } = body;

        let matchQuery = db
          .from("matches")
          .select("id, round_number, home_score, away_score, status")
          .eq("tournament_id", tournamentId)
          .eq("status", "finished");

        if (seasonId) matchQuery = matchQuery.eq("season_id", seasonId);
        if (round) matchQuery = matchQuery.eq("round_number", Number(round));

        const { data: finishedMatches, error: mErr } = await matchQuery;
        if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
        if (!finishedMatches || finishedMatches.length === 0) {
          return NextResponse.json({ error: "Nenhuma partida finalizada encontrada", scored: 0 });
        }

        const matchIds = finishedMatches.map((m: { id: number }) => m.id);
        const matchMap = new Map(finishedMatches.map((m: { id: number; home_score: number; away_score: number; round_number: number }) => [m.id, m]));

        const { data: preds, error: pErr } = await db
          .from("predictions")
          .select("id, match_id, home_team_goals, away_team_goals, user_id")
          .in("match_id", matchIds);

        if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
        if (!preds || preds.length === 0) {
          return NextResponse.json({ scored: 0, message: "Nenhum palpite encontrado para as partidas" });
        }

        let scored = 0;
        for (const pred of preds) {
          const match = matchMap.get(pred.match_id) as { home_score: number; away_score: number } | undefined;
          if (!match) continue;

          const predHome = pred.home_team_goals;
          const predAway = pred.away_team_goals;
          const realHome = match.home_score;
          const realAway = match.away_score;

          const isExact = predHome === realHome && predAway === realAway;

          const predResult = predHome > predAway ? "home" : predHome < predAway ? "away" : "draw";
          const realResult = realHome > realAway ? "home" : realHome < realAway ? "away" : "draw";
          const isCorrectResult = predResult === realResult;

          let points = 0;
          if (isExact) points = 10;
          else if (isCorrectResult) points = 5;

          const { error: uErr } = await db
            .from("predictions")
            .update({
              points_earned: points,
              is_correct: isCorrectResult,
              is_exact_score: isExact,
              tournament_id: tournamentId,
              season_id: seasonId || null,
            })
            .eq("id", pred.id);

          if (!uErr) scored++;
        }

        return NextResponse.json({ scored, totalPredictions: preds.length, matchesProcessed: finishedMatches.length });
      }

      case "sync_predictions_season": {
        const { tournamentId, seasonId } = body;

        const { data, error } = await db
          .from("predictions")
          .update({ season_id: seasonId })
          .eq("tournament_id", tournamentId)
          .is("season_id", null)
          .select("id");

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ updated: data?.length || 0 });
      }

      case "import_teams": {
        const { tournamentId, seasonId } = body;

        const data = await sofascoreFetch(
          `/tournaments/get-standings?tournamentId=${tournamentId}&seasonId=${seasonId}&type=total`
        );

        const allStandings: { rows?: { team: Record<string, unknown> }[]; name?: string }[] = data.standings || [];
        if (allStandings.length === 0) {
          return NextResponse.json({ error: "Nenhum time encontrado" }, { status: 404 });
        }

        const teamSet = new Map<number, Record<string, unknown>>();

        for (const standing of allStandings) {
          const rows = standing.rows || [];
          for (const row of rows) {
            const team = row.team as {
              id: number;
              name: string;
              shortName?: string;
              nameCode?: string;
              slug?: string;
              country?: { name?: string; alpha2?: string; alpha3?: string };
              teamColors?: { primary?: string; secondary?: string; text?: string };
            };
            if (!teamSet.has(team.id)) {
              teamSet.set(team.id, {
                id: team.id,
                name: team.name,
                short_name: team.shortName || null,
                name_code: team.nameCode || null,
                slug: team.slug || null,
                country_name: team.country?.name || "Brazil",
                country_alpha2: team.country?.alpha2 || "BR",
                country_alpha3: team.country?.alpha3 || "BRA",
                primary_color: team.teamColors?.primary || null,
                secondary_color: team.teamColors?.secondary || null,
                text_color: team.teamColors?.text || null,
                primary_tournament_id: tournamentId,
                updated_at: new Date().toISOString(),
                last_sync_at: new Date().toISOString(),
              });
            }
          }
        }

        const teamsData = Array.from(teamSet.values());

        if (teamsData.length === 0) {
          return NextResponse.json({ error: "Nenhum time encontrado" }, { status: 404 });
        }

        const { error } = await db
          .from("teams")
          .upsert(teamsData, { onConflict: "id" });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ teams: teamsData, count: teamsData.length });
      }

      case "get_standings": {
        const { tournamentId, seasonId } = body;

        const data = await sofascoreFetch(
          `/tournaments/get-standings?tournamentId=${tournamentId}&seasonId=${seasonId}&type=total`
        );

        return NextResponse.json({
          standings: data.standings || [],
          tournament: data.tournament || null,
        });
      }

      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin SofaScore API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
