"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface Tournament {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  format: string;
  is_featured?: boolean;
  display_order?: number;
  sofascore_id?: number | null;
}

interface TournamentSeason {
  id: string;
  tournament_id: string;
  year?: string;
  is_current: boolean;
  current_round_type?: string;
  current_round_number?: number;
  sofascore_season_id?: number | null;
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
  const [computedRounds, setComputedRounds] = useState<Record<string, number>>({});

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
          .select("id, name, slug, logo_url, format, is_featured, display_order, sofascore_id")
          .order("display_order", { ascending: true });

        type TournamentRow = {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          is_featured: boolean;
          display_order: number;
          format: string;
          sofascore_id: number | null;
        };

        const rows = (tournamentsData as TournamentRow[] | null) || [];

        const formatted: Tournament[] = rows.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          logo_url: t.logo_url || "/images/brasileirao-logo.svg",
          format: t.format || "league",
          is_featured: t.is_featured,
          display_order: t.display_order,
          sofascore_id: t.sofascore_id,
        }));

        const featuredFirst = formatted.filter((t) => t.is_featured);
        const rest = formatted.filter((t) => !t.is_featured);
        setTournaments([...featuredFirst, ...rest]);

        if (rows.length > 0) {
          const tournamentIds = rows.map((t) => t.id);
          const { data: seasonsData } = await supabase
            .from("tournament_seasons")
            .select("id, tournament_id, year, is_current, current_round_type, current_round_number, sofascore_season_id")
            .in("tournament_id", tournamentIds)
            .eq("is_current", true);

          type SeasonRow = {
            id: string;
            tournament_id: string;
            year: string | null;
            is_current: boolean;
            current_round_type: string | null;
            current_round_number: number | null;
            sofascore_season_id: number | null;
          };

          const seasonRows = (seasonsData as SeasonRow[] | null) || [];
          setSeasons(
            seasonRows.map((s) => ({
              id: s.id,
              tournament_id: s.tournament_id,
              year: s.year || undefined,
              is_current: s.is_current,
              current_round_type: s.current_round_type || undefined,
              current_round_number: s.current_round_number || undefined,
              sofascore_season_id: s.sofascore_season_id,
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
    tournamentIds: string[],
    _seasonRows: Array<{ id: string; tournament_id: string; current_round_number: number | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any
  ) => {
    const roundMap: Record<string, number> = {};

    for (const tId of tournamentIds) {
      const { data: matchesData } = await supabase
        .from("matches")
        .select("round_number, status, start_time")
        .eq("tournament_id", tId)
        .order("round_number", { ascending: true });

      type MatchRow = { round_number: number; status: string; start_time: string };
      const matches = (matchesData as MatchRow[] | null) || [];

      if (matches.length === 0) {
        roundMap[tId] = 1;
        continue;
      }

      const roundStats = new Map<number, { total: number; finished: number; live: number; scheduled: number; hasLive: boolean }>();
      
      for (const m of matches) {
        const rn = m.round_number;
        if (!roundStats.has(rn)) {
          roundStats.set(rn, { total: 0, finished: 0, live: 0, scheduled: 0, hasLive: false });
        }
        const stats = roundStats.get(rn)!;
        stats.total++;
        if (m.status === "finished") stats.finished++;
        else if (m.status === "live") { stats.live++; stats.hasLive = true; }
        else if (m.status === "scheduled") stats.scheduled++;
      }

      const sortedRounds = Array.from(roundStats.keys()).sort((a, b) => a - b);
      let currentRound = 1;

      for (const rn of sortedRounds) {
        const stats = roundStats.get(rn)!;
        
        if (stats.hasLive) {
          currentRound = rn;
          break;
        }
        
        if (stats.scheduled > 0 && stats.finished < stats.total) {
          currentRound = rn;
          break;
        }
        
        if (stats.finished === stats.total) {
          currentRound = rn + 1;
        }
      }

      const maxRound = Math.max(...sortedRounds);
      roundMap[tId] = Math.min(currentRound, maxRound);
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
