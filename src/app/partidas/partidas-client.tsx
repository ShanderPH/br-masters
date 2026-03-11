"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Filter } from "lucide-react";

import { Navbar } from "@/components/layout";
import { PredictionModal } from "@/components/matches";
import { TournamentTabs } from "@/components/matches/tournament-tabs";
import { RoundSelector } from "@/components/matches/round-selector";
import { KPIStatsBar } from "@/components/matches/kpi-stats-bar";
import { MatchStatusGroup } from "@/components/matches/match-status-group";
import { signOut } from "@/lib/auth/auth-service";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { EnrichedMatch } from "@/lib/supabase/types";
import type {
  MatchData,
  MatchTournament,
  MatchSeason,
  PredictionMap,
  KPIStats,
  MatchFilter,
} from "@/components/matches/types";

interface PartidasUser {
  id: string;
  supabaseId: string;
  name: string;
  points: number;
  level: number;
  xp: number;
  role: "user" | "admin";
  predictionsCount: number;
  correctPredictions: number;
  exactScorePredictions: number;
  currentRank: number;
}

interface PartidasClientProps {
  user: PartidasUser;
  tournaments: MatchTournament[];
  seasons: MatchSeason[];
  upcomingMatches: MatchData[];
  finishedMatches: MatchData[];
  initialPredictions: PredictionMap;
}

export function PartidasClient({
  user,
  tournaments,
  seasons,
  upcomingMatches,
  finishedMatches,
  initialPredictions,
}: PartidasClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  const initialTournamentId = searchParams.get("torneio") || tournaments[0]?.id || null;
  const initialRound = searchParams.get("rodada") ? Number(searchParams.get("rodada")) : null;

  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(initialTournamentId);
  const [selectedRound, setSelectedRound] = useState<number | null>(initialRound);
  const [predictions, setPredictions] = useState<PredictionMap>(initialPredictions);
  const [filter, setFilter] = useState<MatchFilter>("all");
  const [selectedMatchForModal, setSelectedMatchForModal] = useState<EnrichedMatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentSeason = useMemo(
    () => seasons.find((s) => s.tournament_id === selectedTournamentId) || null,
    [seasons, selectedTournamentId]
  );

  useEffect(() => {
    if (selectedTournamentId && !selectedRound && currentSeason?.current_round_number) {
      setSelectedRound(currentSeason.current_round_number);
    }
  }, [selectedTournamentId, currentSeason, selectedRound]);

  const allMatches = useMemo(
    () => [...upcomingMatches, ...finishedMatches],
    [upcomingMatches, finishedMatches]
  );

  const filteredByTournament = useMemo(() => {
    if (!selectedTournamentId) return allMatches;
    return allMatches.filter((m) => m.tournament_id === selectedTournamentId);
  }, [allMatches, selectedTournamentId]);

  const availableRounds = useMemo(() => {
    const roundsMap = new Map<number, string | null>();
    filteredByTournament.forEach((m) => {
      if (m.round_number !== null && !roundsMap.has(m.round_number)) {
        roundsMap.set(m.round_number, m.round_name);
      }
    });
    return Array.from(roundsMap.entries())
      .map(([num, name]) => ({ number: num, name }))
      .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  }, [filteredByTournament]);

  const filteredByRound = useMemo(() => {
    if (selectedRound === null) return filteredByTournament;
    return filteredByTournament.filter((m) => m.round_number === selectedRound);
  }, [filteredByTournament, selectedRound]);

  const { upcoming, finished } = useMemo(() => {
    const now = new Date();
    let up = filteredByRound.filter(
      (m) => m.status !== "finished" && (m.status === "live" || new Date(m.start_time) > now || m.status === "scheduled")
    );
    let fin = filteredByRound.filter((m) => m.status === "finished");

    if (filter === "pending") {
      up = up.filter((m) => !predictions[m.id]);
      fin = [];
    } else if (filter === "predicted") {
      up = up.filter((m) => !!predictions[m.id]);
      fin = fin.filter((m) => !!predictions[m.id]);
    }

    up.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    fin.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

    return { upcoming: up, finished: fin };
  }, [filteredByRound, predictions, filter]);

  const kpiStats: KPIStats = useMemo(() => {
    const roundMatches = filteredByRound;
    const upcomingInRound = roundMatches.filter((m) => m.status !== "finished");
    const predictionsMade = roundMatches.filter((m) => !!predictions[m.id]).length;

    const finishedWithPredictions = roundMatches.filter(
      (m) => m.status === "finished" && predictions[m.id]
    );
    const roundPoints = finishedWithPredictions.reduce(
      (acc, m) => acc + (predictions[m.id]?.pointsEarned || 0),
      0
    );
    const exactScores = finishedWithPredictions.filter(
      (m) => predictions[m.id]?.isExactScore
    ).length;
    const correctResults = finishedWithPredictions.filter(
      (m) => predictions[m.id]?.isCorrectResult && !predictions[m.id]?.isExactScore
    ).length;
    const totalWithResult = finishedWithPredictions.length;
    const accuracyRate =
      totalWithResult > 0
        ? Math.round(((exactScores + correctResults) / totalWithResult) * 100)
        : 0;

    return {
      totalMatches: roundMatches.length,
      remainingMatches: upcomingInRound.length,
      predictionsMade,
      roundPoints,
      accuracyRate,
      currentRank: user.currentRank,
      exactScores,
      correctResults,
    };
  }, [filteredByRound, predictions, user.currentRank]);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const handleTournamentSelect = useCallback(
    (id: string) => {
      setSelectedTournamentId(id);
      setSelectedRound(null);
      setFilter("all");
      const params = new URLSearchParams();
      params.set("torneio", id);
      router.replace(`/partidas?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const handleRoundSelect = useCallback(
    (round: number | null) => {
      setSelectedRound(round);
      if (selectedTournamentId) {
        const params = new URLSearchParams();
        params.set("torneio", selectedTournamentId);
        if (round !== null) params.set("rodada", String(round));
        router.replace(`/partidas?${params.toString()}`, { scroll: false });
      }
    },
    [selectedTournamentId, router]
  );

  const handlePredict = useCallback(
    (match: MatchData) => {
      const enriched: EnrichedMatch = {
        id: match.id,
        tournament_id: match.tournament_id,
        season_id: match.season_id,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        slug: match.slug,
        round_number: match.round_number,
        round_name: match.round_name,
        start_time: match.start_time,
        status: match.status,
        home_score: match.home_score,
        away_score: match.away_score,
        tournament_name: match.tournament_name,
        home_team_name: match.home_team_name,
        home_team_short_name: match.home_team_code,
        home_team_logo: match.home_team_logo,
        away_team_name: match.away_team_name,
        away_team_short_name: match.away_team_code,
        away_team_logo: match.away_team_logo,
      };
      setSelectedMatchForModal(enriched);
      setIsModalOpen(true);
    },
    []
  );

  const handleSubmitPrediction = useCallback(
    async (homeScore: number, awayScore: number) => {
      if (!selectedMatchForModal) return;
      setIsSaving(true);

      try {
        type WinnerType = "home" | "away" | "draw";
        let winner: WinnerType = "draw";
        if (homeScore > awayScore) winner = "home";
        else if (awayScore > homeScore) winner = "away";

        const existingPrediction = predictions[selectedMatchForModal.id];

        if (existingPrediction) {
          await (supabase.from("predictions") as ReturnType<typeof supabase.from>)
            .update({
              home_team_goals: homeScore,
              away_team_goals: awayScore,
              winner,
              updated_at: new Date().toISOString(),
            } as Record<string, unknown>)
            .eq("user_id", user.supabaseId)
            .eq("match_id", String(selectedMatchForModal.id));
        } else {
          await (supabase.from("predictions") as ReturnType<typeof supabase.from>).insert({
            user_id: user.supabaseId,
            match_id: String(selectedMatchForModal.id),
            home_team_goals: homeScore,
            away_team_goals: awayScore,
            winner,
          } as Record<string, unknown>);
        }

        setPredictions((prev) => ({
          ...prev,
          [selectedMatchForModal.id]: { homeScore, awayScore },
        }));

        setIsModalOpen(false);
        setSelectedMatchForModal(null);
      } catch (error) {
        console.error("Error saving prediction:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [selectedMatchForModal, predictions, supabase, user.supabaseId]
  );

  const filterButtons: Array<{ key: MatchFilter; label: string; count: number }> = [
    { key: "all", label: "Todas", count: filteredByRound.length },
    {
      key: "pending",
      label: "Pendentes",
      count: filteredByRound.filter(
        (m) => m.status !== "finished" && !predictions[m.id]
      ).length,
    },
    {
      key: "predicted",
      label: "Palpitadas",
      count: filteredByRound.filter((m) => !!predictions[m.id]).length,
    },
  ];

  const totalVisible = upcoming.length + finished.length;

  return (
    <div className="min-h-screen bg-brm-background">
      <Navbar
        isAuthenticated={true}
        user={{
          id: user.id,
          name: user.name,
          points: user.points,
          level: user.level,
          xp: user.xp,
          role: user.role,
        }}
        onLogout={handleLogout}
      />

      <main className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 pt-18 sm:pt-20 md:pt-24 pb-24 sm:pb-8">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 flex items-center justify-center bg-brm-primary/20 -skew-x-6">
              <Calendar className="w-4 h-4 text-brm-primary skew-x-6" />
            </div>
            <h1 className="font-display font-black text-xl sm:text-2xl md:text-3xl uppercase italic text-brm-text-primary">
              Partidas
            </h1>
          </div>
          <p className="text-brm-text-muted text-xs sm:text-sm font-display ml-11">
            Faça seus palpites e acompanhe os resultados
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 sm:mb-6"
        >
          <TournamentTabs
            tournaments={tournaments}
            selectedId={selectedTournamentId}
            onSelect={handleTournamentSelect}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-6"
        >
          <KPIStatsBar stats={kpiStats} />
        </motion.div>

        {availableRounds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 sm:mb-5"
          >
            <RoundSelector
              rounds={availableRounds}
              selectedRound={selectedRound}
              onSelect={handleRoundSelect}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-5 overflow-x-auto no-scrollbar"
        >
          <Filter size={16} className="text-brm-text-muted shrink-0" />
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`
                shrink-0 px-3 py-1.5 font-display font-bold text-[10px] sm:text-xs uppercase tracking-wide
                transition-all duration-200 -skew-x-3
                ${
                  filter === btn.key
                    ? "bg-brm-primary text-white shadow-md"
                    : "bg-brm-card/60 text-brm-text-muted hover:bg-brm-card hover:text-brm-text-secondary"
                }
              `}
            >
              <span className="skew-x-3">
                {btn.label} ({btn.count})
              </span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedTournamentId}-${selectedRound}-${filter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {totalVisible === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <Calendar className="w-12 h-12 text-brm-text-muted/30 mb-3" />
                <p className="font-display text-brm-text-muted text-sm">
                  {filter === "pending"
                    ? "Você já fez todos os palpites!"
                    : filter === "predicted"
                      ? "Nenhum palpite feito ainda para essa seleção"
                      : "Nenhuma partida encontrada para essa seleção"}
                </p>
              </motion.div>
            ) : (
              <>
                <MatchStatusGroup
                  status="upcoming"
                  matches={upcoming}
                  predictions={predictions}
                  onPredict={handlePredict}
                  defaultExpanded={true}
                />

                <MatchStatusGroup
                  status="finished"
                  matches={finished}
                  predictions={predictions}
                  defaultExpanded={upcoming.length === 0}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <PredictionModal
        match={selectedMatchForModal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMatchForModal(null);
        }}
        onSubmit={handleSubmitPrediction}
        initialPrediction={
          selectedMatchForModal ? predictions[selectedMatchForModal.id] : null
        }
        isLoading={isSaving}
      />
    </div>
  );
}
