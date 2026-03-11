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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

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

  const text = await response.text();
  if (!text || text.trim().length === 0) {
    return { events: [], seasons: [], standings: [], rounds: [] };
  }
  return JSON.parse(text);
}

async function fetchAllEvents(sofascoreTournamentId: number, sofascoreSeasonId: number): Promise<SofascoreEvent[]> {
  const eventMap = new Map<number, SofascoreEvent>();

  let pageIndex = 0;
  let hasNext = true;
  while (hasNext && pageIndex < 20) {
    const data = await sofascoreFetch(
      `/tournaments/get-last-matches?tournamentId=${sofascoreTournamentId}&seasonId=${sofascoreSeasonId}&pageIndex=${pageIndex}`
    );
    const events: SofascoreEvent[] = data.events || [];
    for (const e of events) eventMap.set(e.id, e);
    hasNext = data.hasNextPage === true;
    pageIndex++;
  }

  pageIndex = 0;
  hasNext = true;
  while (hasNext && pageIndex < 20) {
    const data = await sofascoreFetch(
      `/tournaments/get-next-matches?tournamentId=${sofascoreTournamentId}&seasonId=${sofascoreSeasonId}&pageIndex=${pageIndex}`
    );
    const events: SofascoreEvent[] = data.events || [];
    for (const e of events) eventMap.set(e.id, e);
    hasNext = data.hasNextPage === true;
    pageIndex++;
  }

  return Array.from(eventMap.values());
}

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = (profile as { role: string } | null)?.role;
  if (!userRole || userRole !== "admin") return null;
  return user;
}

async function getBrazilCountryId(db: DB): Promise<string> {
  const { data: country } = await db
    .from("countries")
    .select("id")
    .eq("code", "BR")
    .single();

  if (country) return (country as { id: string }).id;

  const { data: created, error } = await db
    .from("countries")
    .insert({ name: "Brazil", code: "BR" })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`Failed to create Brazil country record: ${error?.message || "Insert returned null (check RLS policies)"}`);
  }

  return (created as { id: string }).id;
}

function mapSofascoreStatus(statusType: string | undefined): string {
  switch (statusType) {
    case "finished": return "finished";
    case "inprogress": return "live";
    case "notstarted": return "scheduled";
    case "postponed": return "postponed";
    case "canceled": return "canceled";
    default: return "scheduled";
  }
}

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

      case "get_rounds": {
        const { sofascoreTournamentId, sofascoreSeasonId } = body;

        const data = await sofascoreFetch(
          `/tournaments/get-rounds?tournamentId=${sofascoreTournamentId}&seasonId=${sofascoreSeasonId}`
        );

        return NextResponse.json({
          rounds: data.rounds || [],
          currentRound: data.currentRound || null,
        });
      }

      case "get_seasons": {
        const { sofascoreTournamentId } = body;

        const data = await sofascoreFetch(
          `/tournaments/get-seasons?tournamentId=${sofascoreTournamentId}`
        );

        return NextResponse.json({ seasons: data.seasons || [] });
      }

      case "import_matches": {
        const { tournamentId, seasonId, sofascoreTournamentId, sofascoreSeasonId } = body;

        if (!tournamentId || !seasonId) {
          return NextResponse.json({ error: "tournamentId e seasonId (UUIDs) são obrigatórios" }, { status: 400 });
        }

        if (!sofascoreTournamentId || !sofascoreSeasonId) {
          return NextResponse.json({ error: "sofascoreTournamentId e sofascoreSeasonId são obrigatórios" }, { status: 400 });
        }

        const countryId = await getBrazilCountryId(db);
        const events = await fetchAllEvents(sofascoreTournamentId, sofascoreSeasonId);

        if (events.length === 0) {
          return NextResponse.json({ matches: [], count: 0, message: "Nenhuma partida encontrada na API" });
        }

        const uniqueTeams = new Map<number, { name: string; code: string | null }>();
        for (const e of events) {
          if (!uniqueTeams.has(e.homeTeam.id)) {
            uniqueTeams.set(e.homeTeam.id, {
              name: e.homeTeam.name,
              code: e.homeTeam.nameCode || e.homeTeam.shortName || null,
            });
          }
          if (!uniqueTeams.has(e.awayTeam.id)) {
            uniqueTeams.set(e.awayTeam.id, {
              name: e.awayTeam.name,
              code: e.awayTeam.nameCode || e.awayTeam.shortName || null,
            });
          }
        }

        const teamsToUpsert = Array.from(uniqueTeams.entries()).map(([sofascoreId, t]) => ({
          name: t.name,
          slug: t.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          name_code: t.code || t.name.substring(0, 3).toUpperCase(),
          country_id: countryId,
          logo_url: `/api/team-logo/${sofascoreId}`,
          sofascore_id: sofascoreId,
          updated_at: new Date().toISOString(),
        }));

        const teamBatchSize = 50;
        for (let i = 0; i < teamsToUpsert.length; i += teamBatchSize) {
          const batch = teamsToUpsert.slice(i, i + teamBatchSize);
          await db.from("teams").upsert(batch, { onConflict: "sofascore_id", ignoreDuplicates: false });
        }

        const { data: allTeams } = await db
          .from("teams")
          .select("id, sofascore_id")
          .in("sofascore_id", Array.from(uniqueTeams.keys()));

        const teamMap = new Map<number, string>();
        for (const t of (allTeams || []) as { id: string; sofascore_id: number }[]) {
          teamMap.set(t.sofascore_id, t.id);
        }

        const now = new Date().toISOString();
        const matchesData = events.map((e) => ({
          tournament_id: tournamentId,
          season_id: seasonId,
          home_team_id: teamMap.get(e.homeTeam.id) || null,
          away_team_id: teamMap.get(e.awayTeam.id) || null,
          slug: e.slug,
          round_number: e.roundInfo?.round || null,
          round_name: e.roundInfo?.name || null,
          start_time: new Date(e.startTimestamp * 1000).toISOString(),
          status: mapSofascoreStatus(e.status.type),
          home_score: e.homeScore?.display ?? e.homeScore?.current ?? null,
          away_score: e.awayScore?.display ?? e.awayScore?.current ?? null,
          sofascore_id: e.id,
          updated_at: now,
        })).filter((m) => m.home_team_id && m.away_team_id);

        let totalUpserted = 0;
        let errorCount = 0;
        const errors: string[] = [];
        const matchBatchSize = 50;

        for (let i = 0; i < matchesData.length; i += matchBatchSize) {
          const batch = matchesData.slice(i, i + matchBatchSize);
          const { error } = await db
            .from("matches")
            .upsert(batch, { onConflict: "sofascore_id", ignoreDuplicates: false });

          if (error) {
            errors.push(`Batch ${Math.floor(i / matchBatchSize)}: ${error.message}`);
            errorCount += batch.length;
          } else {
            totalUpserted += batch.length;
          }
        }

        const roundNumbers = [...new Set(events.map((e) => e.roundInfo?.round).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));
        const pastCount = events.filter((e) => e.status.type === "finished").length;
        const futureCount = events.filter((e) => e.status.type === "notstarted").length;

        return NextResponse.json({
          total: events.length,
          upserted: totalUpserted,
          teamsProcessed: uniqueTeams.size,
          errors: errorCount,
          errorMessages: errors.slice(0, 10),
          roundNumbers,
          pastCount,
          futureCount,
        });
      }

      case "import_round_matches": {
        const { tournamentId, seasonId, sofascoreTournamentId, sofascoreSeasonId, round } = body;
        
        if (!round) {
          return NextResponse.json({ error: "Rodada não informada" }, { status: 400 });
        }

        if (!tournamentId || !seasonId) {
          return NextResponse.json({ error: "tournamentId e seasonId (UUIDs) são obrigatórios" }, { status: 400 });
        }

        const countryIdRound = await getBrazilCountryId(db);
        const events = await fetchAllEvents(sofascoreTournamentId, sofascoreSeasonId);
        const roundEvents = events.filter((e) => e.roundInfo?.round === Number(round));

        if (roundEvents.length === 0) {
          return NextResponse.json({ error: `Nenhuma partida encontrada para rodada ${round}`, count: 0 }, { status: 404 });
        }

        const uniqueTeamsRound = new Map<number, { name: string; code: string | null }>();
        for (const e of roundEvents) {
          if (!uniqueTeamsRound.has(e.homeTeam.id)) {
            uniqueTeamsRound.set(e.homeTeam.id, { name: e.homeTeam.name, code: e.homeTeam.nameCode || e.homeTeam.shortName || null });
          }
          if (!uniqueTeamsRound.has(e.awayTeam.id)) {
            uniqueTeamsRound.set(e.awayTeam.id, { name: e.awayTeam.name, code: e.awayTeam.nameCode || e.awayTeam.shortName || null });
          }
        }

        const roundTeamsToUpsert = Array.from(uniqueTeamsRound.entries()).map(([sid, t]) => ({
          name: t.name,
          slug: t.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          name_code: t.code || t.name.substring(0, 3).toUpperCase(),
          country_id: countryIdRound,
          logo_url: `/api/team-logo/${sid}`,
          sofascore_id: sid,
          updated_at: new Date().toISOString(),
        }));

        await db.from("teams").upsert(roundTeamsToUpsert, { onConflict: "sofascore_id", ignoreDuplicates: false });

        const { data: roundTeamsData } = await db
          .from("teams")
          .select("id, sofascore_id")
          .in("sofascore_id", Array.from(uniqueTeamsRound.keys()));

        const roundTeamMap = new Map<number, string>();
        for (const t of (roundTeamsData || []) as { id: string; sofascore_id: number }[]) {
          roundTeamMap.set(t.sofascore_id, t.id);
        }

        const nowRound = new Date().toISOString();
        const roundMatchesData = roundEvents.map((e) => ({
          tournament_id: tournamentId,
          season_id: seasonId,
          home_team_id: roundTeamMap.get(e.homeTeam.id) || null,
          away_team_id: roundTeamMap.get(e.awayTeam.id) || null,
          slug: e.slug,
          round_number: e.roundInfo?.round || null,
          round_name: e.roundInfo?.name || null,
          start_time: new Date(e.startTimestamp * 1000).toISOString(),
          status: mapSofascoreStatus(e.status.type),
          home_score: e.homeScore?.display ?? e.homeScore?.current ?? null,
          away_score: e.awayScore?.display ?? e.awayScore?.current ?? null,
          sofascore_id: e.id,
          updated_at: nowRound,
        })).filter((m) => m.home_team_id && m.away_team_id);

        const { error: roundUpsertError } = await db
          .from("matches")
          .upsert(roundMatchesData, { onConflict: "sofascore_id", ignoreDuplicates: false });

        if (roundUpsertError) {
          return NextResponse.json({ error: roundUpsertError.message }, { status: 500 });
        }

        return NextResponse.json({
          count: roundMatchesData.length,
          round: Number(round),
        });
      }

      case "update_match_scores": {
        const { sofascoreTournamentId, sofascoreSeasonId } = body;

        const events = await fetchAllEvents(sofascoreTournamentId, sofascoreSeasonId);
        const finishedEvents = events.filter((e) => e.status.type === "finished");

        let updatedCount = 0;
        let notFoundCount = 0;

        for (const e of finishedEvents) {
          const { error, count } = await db
            .from("matches")
            .update({
              status: "finished",
              home_score: e.homeScore?.display ?? e.homeScore?.current ?? 0,
              away_score: e.awayScore?.display ?? e.awayScore?.current ?? 0,
              updated_at: new Date().toISOString(),
            })
            .eq("sofascore_id", e.id)
            .select("id");

          if (!error && count && count > 0) {
            updatedCount++;
          } else {
            notFoundCount++;
          }
        }

        return NextResponse.json({ 
          updated: updatedCount, 
          notFound: notFoundCount,
          total: finishedEvents.length 
        });
      }

      case "calculate_scores": {
        const { tournamentId, seasonId, round } = body;

        if (!tournamentId) {
          return NextResponse.json({ error: "tournamentId (UUID) é obrigatório" }, { status: 400 });
        }

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

        const matchIds = finishedMatches.map((m: { id: string }) => m.id);
        const matchMap = new Map(finishedMatches.map((m: { id: string; home_score: number; away_score: number; round_number: number }) => [m.id, m]));

        const { data: preds, error: pErr } = await db
          .from("predictions")
          .select("id, match_id, home_team_goals, away_team_goals, user_id")
          .in("match_id", matchIds);

        if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
        if (!preds || preds.length === 0) {
          return NextResponse.json({ scored: 0, message: "Nenhum palpite encontrado para as partidas" });
        }

        let scored = 0;
        const userPoints: Record<string, number> = {};

        // Get scoring config from database
        const { data: configData } = await db.rpc("get_scoring_config");
        const scoringConfig = (configData as Record<string, number>) || {};
        const exactPoints = scoringConfig.exact_score_points ?? 5;
        const resultPoints = scoringConfig.correct_result_points ?? 2;

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
          if (isExact) points = exactPoints;
          else if (isCorrectResult) points = resultPoints;

          const { error: uErr } = await db
            .from("predictions")
            .update({
              points_earned: points,
              is_correct_result: isCorrectResult,
              is_exact_score: isExact,
            })
            .eq("id", pred.id);

          if (!uErr) {
            scored++;
            userPoints[pred.user_id] = (userPoints[pred.user_id] || 0) + points;
          }
        }

        for (const [userId, points] of Object.entries(userPoints)) {
          if (points > 0) {
            await db.rpc("increment_user_points", { user_id: userId, points_to_add: points });
          }
        }

        return NextResponse.json({ 
          scored, 
          totalPredictions: preds.length, 
          matchesProcessed: finishedMatches.length,
          usersUpdated: Object.keys(userPoints).length,
        });
      }

      case "import_teams": {
        const { sofascoreTournamentId, sofascoreSeasonId } = body;

        const countryId = await getBrazilCountryId(db);

        const data = await sofascoreFetch(
          `/tournaments/get-standings?tournamentId=${sofascoreTournamentId}&seasonId=${sofascoreSeasonId}&type=total`
        );

        const allStandings: { rows?: { team: Record<string, unknown> }[]; name?: string }[] = data.standings || [];
        if (allStandings.length === 0) {
          return NextResponse.json({ error: "Nenhum time encontrado" }, { status: 404 });
        }

        let insertedCount = 0;
        let updatedCount = 0;

        for (const standing of allStandings) {
          const rows = standing.rows || [];
          for (const row of rows) {
            const team = row.team as {
              id: number;
              name: string;
              shortName?: string;
              nameCode?: string;
              slug?: string;
              teamColors?: { primary?: string; secondary?: string; text?: string };
            };

            const { data: existing } = await db
              .from("teams")
              .select("id")
              .eq("sofascore_id", team.id)
              .single();

            const teamData = {
              name: team.name,
              slug: team.slug || team.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
              name_code: team.nameCode || team.shortName || team.name.substring(0, 3).toUpperCase(),
              country_id: countryId,
              logo_url: `/api/team-logo/${team.id}`,
              primary_color: team.teamColors?.primary ? `#${team.teamColors.primary}` : null,
              secondary_color: team.teamColors?.secondary ? `#${team.teamColors.secondary}` : null,
              text_color: team.teamColors?.text ? `#${team.teamColors.text}` : null,
              sofascore_id: team.id,
              updated_at: new Date().toISOString(),
            };

            if (existing) {
              await db.from("teams").update(teamData).eq("id", (existing as { id: string }).id);
              updatedCount++;
            } else {
              await db.from("teams").insert(teamData);
              insertedCount++;
            }
          }
        }

        return NextResponse.json({ 
          inserted: insertedCount, 
          updated: updatedCount,
          total: insertedCount + updatedCount 
        });
      }

      case "get_standings": {
        const { sofascoreTournamentId, sofascoreSeasonId } = body;

        const data = await sofascoreFetch(
          `/tournaments/get-standings?tournamentId=${sofascoreTournamentId}&seasonId=${sofascoreSeasonId}&type=total`
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
