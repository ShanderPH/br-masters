"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeDrag } from "@/hooks/use-swipe-drag";
import { Tabs } from "@heroui/react";
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck, Target, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTournamentContext } from "@/components/dashboard/tournament-context";
import { getScoringConfig, type ScoringConfig } from "@/lib/services/scoring-config";
import { getTeamLogoPath } from "@/lib/services/team-logo-service";

type StatsViewKey = "round" | "tournament";

type StatsSnapshot = {
  view: StatsViewKey;
  title: string;
  subtitle: string;
  points: number;
  predictions: number;
  exactScores: number;
  partialScores: number;
  accuracy: number;
};

type UserIdentity = {
  displayName: string;
  avatarUrl: string | null;
  favoriteTeamLogo: string | null;
};

const VIEW_ORDER: StatsViewKey[] = ["round", "tournament"];

const EMPTY_IDENTITY: UserIdentity = {
  displayName: "Você",
  avatarUrl: null,
  favoriteTeamLogo: null,
};

const EMPTY_SNAPSHOT: Record<StatsViewKey, StatsSnapshot> = {
  round: {
    view: "round",
    title: "Seu desempenho",
    subtitle: "Rodada",
    points: 0,
    predictions: 0,
    exactScores: 0,
    partialScores: 0,
    accuracy: 0,
  },
  tournament: {
    view: "tournament",
    title: "Seu desempenho",
    subtitle: "Torneio",
    points: 0,
    predictions: 0,
    exactScores: 0,
    partialScores: 0,
    accuracy: 0,
  },
};

function rotateView(current: StatsViewKey, direction: 1 | -1): StatsViewKey {
  const index = VIEW_ORDER.indexOf(current);
  const nextIndex = (index + direction + VIEW_ORDER.length) % VIEW_ORDER.length;
  return VIEW_ORDER[nextIndex];
}

function calculateAccuracyByPoints(totalPredictions: number, earnedPoints: number, maxPointsPerPrediction: number) {
  if (totalPredictions <= 0 || earnedPoints <= 0 || maxPointsPerPrediction <= 0) return 0;
  const maxPossible = totalPredictions * maxPointsPerPrediction;
  return Math.min(100, Math.round((earnedPoints / maxPossible) * 100));
}

function resolvePredictionPoints(
  prediction: { points_earned: number | null; is_exact_score: boolean | null; is_correct_result: boolean | null },
  scoringConfig: ScoringConfig,
) {
  if (typeof prediction.points_earned === "number") return prediction.points_earned;
  if (prediction.is_exact_score) return scoringConfig.exact_score_points;
  if (prediction.is_correct_result) return scoringConfig.correct_result_points;
  return scoringConfig.incorrect_points;
}

function StatsBackground({ view }: { view: StatsViewKey }) {
  const isRound = view === "round";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={
          isRound
            ? "absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,184,184,0.35),rgba(8,18,34,0.95)_55%,rgba(6,12,24,0.98))]"
            : "absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(204,255,0,0.28),rgba(36,32,10,0.94)_55%,rgba(19,17,8,0.98))]"
        }
      />
      <div
        className={
          isRound
            ? "absolute top-[-15%] left-[-10%] h-[85%] w-[58%] border-r border-b border-brm-primary/35 bg-linear-to-br from-brm-primary/20 to-transparent"
            : "absolute top-[-12%] right-[-8%] h-[80%] w-[55%] border-l border-b border-brm-secondary/35 bg-linear-to-bl from-brm-secondary/18 to-transparent"
        }
        style={{ clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 85%)" }}
      />
      <div
        className={
          isRound
            ? "absolute bottom-[-22%] right-[-12%] h-[75%] w-[65%] border-t border-l border-cyan-300/30 bg-linear-to-tl from-cyan-500/20 to-transparent"
            : "absolute bottom-[-20%] left-[-10%] h-[72%] w-[62%] border-t border-r border-lime-300/25 bg-linear-to-tr from-lime-400/16 to-transparent"
        }
        style={{ clipPath: "polygon(20% 0, 100% 18%, 100% 100%, 0 100%)" }}
      />
      <motion.div
        className={
          isRound
            ? "absolute -left-24 top-6 h-10 w-72 -skew-x-12 bg-linear-to-r from-transparent via-cyan-200/30 to-transparent"
            : "absolute -left-20 top-8 h-10 w-72 -skew-x-12 bg-linear-to-r from-transparent via-lime-200/30 to-transparent"
        }
        animate={{ x: [-40, 240] }}
        transition={{ duration: 3.8, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
      />
    </div>
  );
}

function MetricValue({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone: "primary" | "secondary" | "neutral" }) {
  const toneClass =
    tone === "primary"
      ? "text-brm-primary"
      : tone === "secondary"
        ? "text-brm-secondary"
        : "text-brm-text-primary";

  return (
    <div className="bg-black/25 px-1 py-1 sm:px-1.5 sm:py-1.5">
      <p className="text-[6px] sm:text-[7px] font-display font-bold uppercase tracking-wide text-brm-text-muted">{label}</p>
      <p className={`text-xs sm:text-sm leading-none font-display font-black ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[6px] sm:text-[7px] leading-none text-brm-text-muted">{hint}</p> : null}
    </div>
  );
}

interface UserStatsCardProps {
  stats: StatsSnapshot;
  identity: UserIdentity;
  isLoading?: boolean;
  scoringConfig?: ScoringConfig;
  activeView: StatsViewKey;
  onSelectView: (view: StatsViewKey) => void;
  onMoveView: (direction: 1 | -1) => void;
}

export function UserStatsCard({
  stats,
  identity,
  isLoading = false,
  scoringConfig,
  activeView,
  onSelectView,
  onMoveView,
}: UserStatsCardProps) {
  const goToNext = useCallback(() => onMoveView(1), [onMoveView]);
  const goToPrev = useCallback(() => onMoveView(-1), [onMoveView]);
  const { dragProps } = useSwipeDrag({ onNext: goToNext, onPrev: goToPrev });

  if (isLoading) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <StatsBackground view="round" />
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brm-primary" />
        </div>
      </div>
    );
  }

  const avatarSrc = identity.avatarUrl || identity.favoriteTeamLogo;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <StatsBackground view={stats.view} />

      <motion.div className="absolute inset-0 z-10 flex flex-col" {...dragProps}>
        {/* Header: Tabs + Navigation */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-2 pt-2 sm:px-3 sm:pt-3">
          <Tabs
            selectedKey={activeView}
            onSelectionChange={(key) => onSelectView(key as StatsViewKey)}
            variant="secondary"
            className="w-full max-w-[140px] sm:max-w-[180px]"
          >
            <Tabs.ListContainer>
              <Tabs.List
                aria-label="Visualização do desempenho"
                className="w-full *:h-5 sm:*:h-6 *:px-1.5 sm:*:px-2 *:text-[8px] sm:*:text-[9px] *:font-display *:font-black *:uppercase *:tracking-wide"
              >
                <Tabs.Tab id="round">
                  Rodada
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="tournament">
                  Torneio
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel id="round" className="hidden">
              <span />
            </Tabs.Panel>
            <Tabs.Panel id="tournament" className="hidden">
              <span />
            </Tabs.Panel>
          </Tabs>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              aria-label="Visualização anterior"
              onClick={() => onMoveView(-1)}
              className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center bg-black/40 text-brm-text-primary transition-colors hover:bg-black/60 hover:text-brm-primary"
            >
              <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Próxima visualização"
              onClick={() => onMoveView(1)}
              className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center bg-black/40 text-brm-text-primary transition-colors hover:bg-black/60 hover:text-brm-secondary"
            >
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stats.view}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-1 min-h-0 flex-col sm:flex-row gap-1 sm:gap-1.5 px-2 pb-2 sm:px-3 sm:pb-3"
          >
            {/* Left Column: Points */}
            <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-1 bg-black/30 px-2 py-1 sm:px-2 sm:py-1.5 sm:w-[70px] shrink-0">
              <div className="min-w-0">
                <p className="truncate text-[7px] sm:text-[8px] font-display font-bold uppercase tracking-wide text-brm-text-muted">
                  {stats.subtitle}
                </p>
                <p className="text-[8px] sm:text-[9px] font-display font-black uppercase text-brm-text-primary">Pontos</p>
              </div>

              <div className="text-right sm:text-left sm:mt-0.5">
                <p className="leading-none text-lg sm:text-xl font-display font-black text-brm-secondary">
                  {stats.points}
                </p>
                <div className="mt-0.5 inline-flex items-center gap-0.5 text-[6px] sm:text-[7px] font-display font-semibold uppercase text-brm-primary">
                  <ShieldCheck className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  <span>{stats.accuracy}%</span>
                </div>
              </div>
            </div>

            {/* Right Column: User Info + Stats */}
            <div className="flex flex-1 min-h-0 min-w-0 flex-col bg-black/20 px-1.5 py-1 sm:px-2 sm:py-1.5">
              {/* User Header */}
              <div className="flex items-start justify-between gap-1.5 shrink-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[8px] sm:text-[9px] font-display font-black uppercase tracking-wider text-brm-text-primary">
                    {stats.title}
                  </p>
                  <p className="truncate text-[7px] sm:text-[8px] font-display uppercase text-brm-text-muted">
                    {identity.displayName}
                  </p>
                </div>

                <div className="relative h-6 w-6 sm:h-8 sm:w-8 shrink-0 bg-black/40">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt={identity.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[8px] sm:text-[10px] font-display font-black text-brm-text-muted">YOU</div>
                  )}
                  {identity.avatarUrl && identity.favoriteTeamLogo ? (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-brm-background-dark">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={identity.favoriteTeamLogo} alt="Time" className="h-full w-full object-cover" />
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-1 sm:mt-1.5 grid grid-cols-4 gap-0.5 sm:gap-1 flex-1 min-h-0">
                <MetricValue label="Palpites" value={String(stats.predictions)} tone="neutral" />
                <MetricValue label="Acurácia" value={`${stats.accuracy}%`} tone="secondary" />
                <MetricValue
                  label="Parciais"
                  value={String(stats.partialScores)}
                  hint={scoringConfig ? `+${scoringConfig.correct_result_points}` : undefined}
                  tone="primary"
                />
                <MetricValue
                  label="Exatos"
                  value={String(stats.exactScores)}
                  hint={scoringConfig ? `+${scoringConfig.exact_score_points}` : undefined}
                  tone="secondary"
                />
              </div>

              {/* Legend */}
              <div className="mt-0.5 sm:mt-1 flex flex-wrap items-center justify-end gap-0.5 sm:gap-1 shrink-0">
                <div className="inline-flex items-center gap-0.5 bg-black/30 px-1 py-0.5 text-[6px] sm:text-[7px] font-display uppercase text-brm-text-muted">
                  <Target className="h-2 w-2 text-brm-primary" />
                  <span>Parciais</span>
                </div>
                <div className="inline-flex items-center gap-0.5 bg-black/30 px-1 py-0.5 text-[6px] sm:text-[7px] font-display uppercase text-brm-text-muted">
                  <Trophy className="h-2 w-2 text-brm-secondary" />
                  <span>Exatos</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function UserStatsCardWithData({
  currentUserId,
}: {
  currentUserId?: string;
}) {
  const { currentTournament, computedRound } = useTournamentContext();
  const tournamentName = currentTournament?.name || "Torneio";
  const [activeView, setActiveView] = useState<StatsViewKey>("round");
  const [identity, setIdentity] = useState<UserIdentity>(EMPTY_IDENTITY);
  const [snapshots, setSnapshots] = useState<Record<StatsViewKey, StatsSnapshot>>(EMPTY_SNAPSHOT);
  const [isLoading, setIsLoading] = useState(true);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>({ exact_score_points: 5, correct_result_points: 2, incorrect_points: 0 });

  useEffect(() => {
    const switchTimer = window.setInterval(() => {
      setActiveView((prev) => rotateView(prev, 1));
    }, 5500);

    return () => {
      window.clearInterval(switchTimer);
    };
  }, []);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUserId) {
        setSnapshots(EMPTY_SNAPSHOT);
        setIdentity(EMPTY_IDENTITY);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const supabase = createClient();
        const tournamentId = currentTournament?.id;
        const roundNumber = Math.max(computedRound, 1);

        const config = await getScoringConfig();
        setScoringConfig(config);

        if (!tournamentId) {
          setSnapshots(EMPTY_SNAPSHOT);
          return;
        }

        const [{ data: profileData }, { data: userData }, { data: matchesData }] = await Promise.all([
          supabase
            .from("user_profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", currentUserId)
            .single(),
          supabase
            .from("users")
            .select("favorite_team_id")
            .eq("id", currentUserId)
            .single(),
          supabase
            .from("matches")
            .select("id, status, round_number")
            .eq("tournament_id", tournamentId)
            .is("deleted_at", null),
        ]);

        type ProfileRow = {
          first_name: string;
          last_name: string | null;
          avatar_url: string | null;
        };
        type UserRow = { favorite_team_id: string | null };
        type MatchRow = { id: string; status: string; round_number: number | null };

        const profile = profileData as ProfileRow | null;
        const userRow = userData as UserRow | null;
        const matches = (matchesData as MatchRow[] | null) || [];

        let favoriteTeamLogo: string | null = null;
        if (userRow?.favorite_team_id) {
          const { data: teamData } = await supabase
            .from("teams")
            .select("name, logo_url")
            .eq("id", userRow.favorite_team_id)
            .single();

          type TeamRow = { name: string; logo_url: string | null };
          const team = teamData as TeamRow | null;
          if (team) {
            favoriteTeamLogo = team.logo_url || getTeamLogoPath(team.name);
          }
        }

        setIdentity({
          displayName: profile
            ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ""}`
            : "Você",
          avatarUrl: profile?.avatar_url || null,
          favoriteTeamLogo,
        });

        const tournamentMatchIds = matches.map((m) => m.id);
        if (tournamentMatchIds.length === 0) {
          setSnapshots({
            round: {
              ...EMPTY_SNAPSHOT.round,
              subtitle: `Rodada ${roundNumber}`,
            },
            tournament: {
              ...EMPTY_SNAPSHOT.tournament,
              subtitle: tournamentName,
            },
          });
          return;
        }

        const { data: predsData } = await supabase
          .from("predictions")
          .select("points_earned, is_exact_score, is_correct_result, match_id")
          .eq("user_id", currentUserId)
          .in("match_id", tournamentMatchIds);

        type PredRow = {
          points_earned: number | null;
          is_exact_score: boolean | null;
          is_correct_result: boolean | null;
          match_id: string;
        };

        const predictions = (predsData as PredRow[] | null) || [];

        const buildSnapshot = (
          view: StatsViewKey,
          title: string,
          subtitle: string,
          scopedMatchIds: string[],
        ): StatsSnapshot => {
          const idSet = new Set(scopedMatchIds);
          const finishedSet = new Set(
            matches.filter((m) => idSet.has(m.id) && m.status === "finished").map((m) => m.id),
          );

          const scopedPredictions = predictions.filter((prediction) => idSet.has(prediction.match_id));
          const finishedPredictions = scopedPredictions.filter((prediction) => finishedSet.has(prediction.match_id));

          const exactScores = finishedPredictions.filter((prediction) => prediction.is_exact_score).length;
          const partialScores = finishedPredictions.filter(
            (prediction) => prediction.is_correct_result && !prediction.is_exact_score,
          ).length;
          const points = finishedPredictions.reduce(
            (accumulator, prediction) => accumulator + resolvePredictionPoints(prediction, config),
            0,
          );

          return {
            view,
            title,
            subtitle,
            points,
            predictions: scopedPredictions.length,
            exactScores,
            partialScores,
            accuracy: calculateAccuracyByPoints(
              scopedPredictions.length,
              points,
              Math.max(config.exact_score_points, 1),
            ),
          };
        };

        const roundMatchIds = matches
          .filter((m) => Number(m.round_number || 0) === roundNumber)
          .map((m) => m.id);

        setSnapshots({
          round: buildSnapshot("round", "Seu desempenho", `Rodada ${roundNumber}`, roundMatchIds),
          tournament: buildSnapshot("tournament", "Seu desempenho", tournamentName, tournamentMatchIds),
        });
      } catch {
        setSnapshots(EMPTY_SNAPSHOT);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [currentUserId, currentTournament?.id, computedRound, tournamentName]);

  return (
    <UserStatsCard
      stats={snapshots[activeView]}
      identity={identity}
      isLoading={isLoading}
      scoringConfig={scoringConfig}
      activeView={activeView}
      onSelectView={(view) => setActiveView(view)}
      onMoveView={(direction) => setActiveView((prev) => rotateView(prev, direction))}
    />
  );
}
