"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface Tournament {
  id: number;
  name: string;
  short_name?: string;
  logo_url?: string;
  wallpaper_url?: string;
  status: "upcoming" | "active" | "finished";
  format: string;
  current_phase?: string;
  season_id?: number;
  most_titles_team_name?: string;
  most_titles_count?: number;
  last_champions?: Array<{ year: string; team_name: string; team_id: number }>;
  is_featured?: boolean;
  display_order?: number;
}

interface TournamentSeason {
  id: number;
  tournament_id: number;
  name: string;
  year?: string;
  is_current: boolean;
  current_round_type?: string;
  current_round_number?: number;
}

interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  currentSeason: TournamentSeason | null;
  currentRound: number;
  isLoading: boolean;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  goToNext: () => void;
  goToPrev: () => void;
  computedRound: number;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export function useTournamentContext() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournamentContext must be used within TournamentProvider");
  return ctx;
}

interface TournamentProviderProps {
  children: ReactNode;
}

export function TournamentProvider({ children }: TournamentProviderProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [seasons, setSeasons] = useState<TournamentSeason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [computedRounds, setComputedRounds] = useState<Record<number, number>>({});

  const currentTournament = tournaments[currentIndex] || null;
  const currentSeason = seasons.find(
    (s) => s.tournament_id === currentTournament?.id && s.is_current
  ) || null;

  const currentRound = currentTournament
    ? computedRounds[currentTournament.id] || currentSeason?.current_round_number || 1
    : 1;

  const computedRound = currentRound;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        const { data: tournamentsData } = await supabase
          .from("tournaments")
          .select("*")
          .in("status", ["active", "upcoming"])
          .order("display_order", { ascending: true });

        type TournamentRow = {
          id: number;
          name: string;
          slug: string;
          short_name: string | null;
          logo_url: string | null;
          wallpaper_url: string | null;
          is_featured: boolean;
          display_order: number;
          format: string;
          season_id: number | null;
          status: string;
          current_phase: string | null;
          most_titles_team_name: string | null;
          most_titles_count: number;
          last_champions: Array<{ year: string; team_name: string; team_id: number }> | null;
        };

        const rows = (tournamentsData as TournamentRow[] | null) || [];

        const formatted: Tournament[] = rows.map((t) => ({
          id: t.id,
          name: t.name,
          short_name: t.short_name || t.name,
          logo_url: t.logo_url || "/images/brasileirao-logo.svg",
          wallpaper_url: t.wallpaper_url || undefined,
          status: (t.status === "active" ? "active" : t.status === "finished" ? "finished" : "upcoming") as Tournament["status"],
          format: t.format || "league",
          current_phase: t.current_phase || undefined,
          season_id: t.season_id || undefined,
          most_titles_team_name: t.most_titles_team_name || undefined,
          most_titles_count: t.most_titles_count || 0,
          last_champions: t.last_champions || [],
          is_featured: t.is_featured,
          display_order: t.display_order,
        }));

        const featuredFirst = formatted.filter((t) => t.is_featured);
        const rest = formatted.filter((t) => !t.is_featured);
        setTournaments([...featuredFirst, ...rest]);

        if (rows.length > 0) {
          const tournamentIds = rows.map((t) => t.id);
          const { data: seasonsData } = await supabase
            .from("tournament_seasons")
            .select("*")
            .in("tournament_id", tournamentIds)
            .eq("is_current", true);

          type SeasonRow = {
            id: number;
            tournament_id: number;
            name: string;
            year: string | null;
            is_current: boolean;
            current_round_type: string | null;
            current_round_number: number | null;
          };

          const seasonRows = (seasonsData as SeasonRow[] | null) || [];
          setSeasons(
            seasonRows.map((s) => ({
              id: s.id,
              tournament_id: s.tournament_id,
              name: s.name,
              year: s.year || undefined,
              is_current: s.is_current,
              current_round_type: s.current_round_type || undefined,
              current_round_number: s.current_round_number || undefined,
            }))
          );

          await computeAutoRounds(tournamentIds, seasonRows, supabase);
        }
      } catch {
        setTournaments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const computeAutoRounds = async (
    tournamentIds: number[],
    seasonRows: Array<{ id: number; tournament_id: number; current_round_number: number | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any
  ) => {
    const roundMap: Record<number, number> = {};

    for (const tId of tournamentIds) {
      const season = seasonRows.find((s) => s.tournament_id === tId);
      const baseRound = season?.current_round_number || 1;

      const { data: roundMatches } = await supabase
        .from("matches")
        .select("id, status")
        .eq("tournament_id", tId)
        .eq("round_number", baseRound);

      type MatchStatus = { id: number; status: string };
      const matches = (roundMatches as MatchStatus[] | null) || [];

      if (matches.length > 0) {
        const finishedCount = matches.filter((m) => m.status === "finished").length;
        const threshold = Math.ceil(matches.length * 0.9);

        if (finishedCount >= threshold) {
          roundMap[tId] = baseRound + 1;
        } else {
          roundMap[tId] = baseRound;
        }
      } else {
        roundMap[tId] = baseRound;
      }
    }

    setComputedRounds(roundMap);
  };

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(tournaments.length, 1));
  }, [tournaments.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + tournaments.length) % Math.max(tournaments.length, 1));
  }, [tournaments.length]);

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        currentTournament,
        currentSeason,
        currentRound,
        isLoading,
        currentIndex,
        setCurrentIndex,
        goToNext,
        goToPrev,
        computedRound,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}
