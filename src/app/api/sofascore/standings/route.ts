import { NextResponse } from "next/server";

interface StandingTeam {
  id: number;
  name: string;
  shortName: string;
  logo: string;
  country: string;
}

interface Standing {
  team: StandingTeam;
  position: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  scoresFor: number;
  scoresAgainst: number;
  goalDifference: number;
  points: number;
}

interface StandingsResponse {
  standings: Standing[];
  tournament: {
    id: number;
    name: string;
    category: string;
  };
}

let standingsCache: { data: StandingsResponse; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getMockStandings(): StandingsResponse {
  return {
    standings: [
      {
        team: { id: 1963, name: "Palmeiras", shortName: "PAL", logo: "/api/team-logo/1963", country: "Brazil" },
        position: 1, matches: 38, wins: 23, draws: 9, losses: 6, scoresFor: 72, scoresAgainst: 39, goalDifference: 33, points: 78,
      },
      {
        team: { id: 1958, name: "Botafogo", shortName: "BOT", logo: "/api/team-logo/1958", country: "Brazil" },
        position: 2, matches: 38, wins: 22, draws: 10, losses: 6, scoresFor: 65, scoresAgainst: 35, goalDifference: 30, points: 76,
      },
      {
        team: { id: 1961, name: "Flamengo", shortName: "FLA", logo: "/api/team-logo/1961", country: "Brazil" },
        position: 3, matches: 38, wins: 21, draws: 8, losses: 9, scoresFor: 68, scoresAgainst: 42, goalDifference: 26, points: 71,
      },
      {
        team: { id: 1967, name: "Fortaleza", shortName: "FOR", logo: "/api/team-logo/1967", country: "Brazil" },
        position: 4, matches: 38, wins: 19, draws: 11, losses: 8, scoresFor: 58, scoresAgainst: 38, goalDifference: 20, points: 68,
      },
      {
        team: { id: 1981, name: "Internacional", shortName: "INT", logo: "/api/team-logo/1981", country: "Brazil" },
        position: 5, matches: 38, wins: 18, draws: 11, losses: 9, scoresFor: 55, scoresAgainst: 40, goalDifference: 15, points: 65,
      },
      {
        team: { id: 1966, name: "São Paulo", shortName: "SAO", logo: "/api/team-logo/1966", country: "Brazil" },
        position: 6, matches: 38, wins: 17, draws: 12, losses: 9, scoresFor: 52, scoresAgainst: 38, goalDifference: 14, points: 63,
      },
      {
        team: { id: 1957, name: "Corinthians", shortName: "COR", logo: "/api/team-logo/1957", country: "Brazil" },
        position: 7, matches: 38, wins: 16, draws: 11, losses: 11, scoresFor: 50, scoresAgainst: 42, goalDifference: 8, points: 59,
      },
      {
        team: { id: 1955, name: "Bahia", shortName: "BAH", logo: "/api/team-logo/1955", country: "Brazil" },
        position: 8, matches: 38, wins: 15, draws: 13, losses: 10, scoresFor: 48, scoresAgainst: 40, goalDifference: 8, points: 58,
      },
      {
        team: { id: 1954, name: "Cruzeiro", shortName: "CRU", logo: "/api/team-logo/1954", country: "Brazil" },
        position: 9, matches: 38, wins: 15, draws: 11, losses: 12, scoresFor: 46, scoresAgainst: 44, goalDifference: 2, points: 56,
      },
      {
        team: { id: 5926, name: "Vasco da Gama", shortName: "VAS", logo: "/api/team-logo/5926", country: "Brazil" },
        position: 10, matches: 38, wins: 14, draws: 12, losses: 12, scoresFor: 44, scoresAgainst: 45, goalDifference: -1, points: 54,
      },
    ],
    tournament: {
      id: 325,
      name: "Brasileirão Série A",
      category: "Brazil",
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId") || process.env.BRASILEIRAO_TOURNAMENT_ID || "325";
    const seasonId = searchParams.get("seasonId") || process.env.BRASILEIRAO_SEASON_ID || "87678";

    // Check cache first
    if (standingsCache && Date.now() - standingsCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(standingsCache.data, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Cache": "HIT",
        },
      });
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "sofascore.p.rapidapi.com";

    if (!RAPIDAPI_KEY) {
      console.warn("RAPIDAPI_KEY not configured, using mock data");
      const mockData = getMockStandings();
      return NextResponse.json(mockData, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          "X-Cache": "MOCK",
        },
      });
    }

    const url = `https://${RAPIDAPI_HOST}/tournaments/get-standings?tournamentId=${tournamentId}&seasonId=${seasonId}&type=total`;

    let apiData = null;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 300 },
      });

      if (response.ok) {
        apiData = await response.json();
      } else {
        console.error(`SofaScore API error: ${response.status}`);
      }
    } catch (fetchError) {
      console.error("SofaScore API fetch error:", fetchError);
    }

    if (apiData && apiData.standings?.[0]?.rows) {
      try {
        const standings: Standing[] = apiData.standings[0].rows.map(
          (row: {
            team: { id: number; name: string; shortName: string; country?: { name: string } };
            matches: number;
            wins: number;
            draws: number;
            losses: number;
            scoresFor: number;
            scoresAgainst: number;
            points: number;
          }, index: number) => ({
            team: {
              id: row.team.id,
              name: row.team.name,
              shortName: row.team.shortName,
              logo: `/api/team-logo/${row.team.id}`,
              country: row.team.country?.name || "Brazil",
            },
            position: index + 1,
            matches: row.matches,
            wins: row.wins,
            draws: row.draws,
            losses: row.losses,
            scoresFor: row.scoresFor,
            scoresAgainst: row.scoresAgainst,
            goalDifference: row.scoresFor - row.scoresAgainst,
            points: row.points,
          })
        );

        const transformedData: StandingsResponse = {
          standings,
          tournament: {
            id: apiData.tournament?.id || parseInt(tournamentId),
            name: apiData.tournament?.name || "Brasileirão Série A",
            category: apiData.tournament?.category || "Brazil",
          },
        };

        standingsCache = {
          data: transformedData,
          timestamp: Date.now(),
        };

        return NextResponse.json(transformedData, {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            "X-Cache": "MISS",
          },
        });
      } catch (transformError) {
        console.error("Error transforming API data:", transformError);
      }
    }

    if (standingsCache) {
      return NextResponse.json(standingsCache.data, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          "X-Cache": "STALE",
          "X-API-Failed": "true",
        },
      });
    }

    const mockData = getMockStandings();
    return NextResponse.json(mockData, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "X-Cache": "MOCK",
        "X-API-Failed": "true",
      },
    });
  } catch (error) {
    console.error("Standings API error:", error);
    const mockData = getMockStandings();
    return NextResponse.json(mockData, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "X-Cache": "MOCK",
        "X-Error": "true",
      },
    });
  }
}
