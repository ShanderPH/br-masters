"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeDrag } from "@/hooks/use-swipe-drag";
import { Tabs } from "@heroui/react";
import { ChevronLeft, ChevronRight, Crown, Loader2, Star, Target, Trophy } from "lucide-react";
import { useTournamentContext } from "@/components/dashboard/tournament-context";
import { createClient } from "@/lib/supabase/client";
import { getScoringConfig, type ScoringConfig } from "@/lib/services/scoring-config";
import { getTeamLogoPath } from "@/lib/services/team-logo-service";

type StatsViewKey = "round" | "tournament";

type AggregatedPerformer = {
  userId: string;
  points: number;
  predictions: number;
  exactScores: number;
  partialScores: number;
};

type BestUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  favoriteTeamLogo: string | null;
  points: number;
  predictions: number;
  exactScores: number;
  partialScores: number;
  rank: number | null;
};

type BestSnapshot = {
  view: StatsViewKey;
  title: string;
  subtitle: string;
  performer: BestUser | null;
};

const VIEW_ORDER: StatsViewKey[] = ["round", "tournament"];

const EMPTY_SNAPSHOT: Record<StatsViewKey, BestSnapshot> = {
  round: {
    view: "round",
    title: "Melhor da rodada",
    subtitle: "Rodada",
    performer: null,
  },
  tournament: {
    view: "tournament",
    title: "Melhor do torneio",
    subtitle: "Torneio",
    performer: null,
  },
};

function rotateView(current: StatsViewKey, direction: 1 | -1): StatsViewKey {
  const index = VIEW_ORDER.indexOf(current);
  const nextIndex = (index + direction + VIEW_ORDER.length) % VIEW_ORDER.length;
  return VIEW_ORDER[nextIndex];
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

function BestCardBackground({ view }: { view: StatsViewKey }) {
  const isRound = view === "round";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={
          isRound
            ? "absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(37,184,184,0.36),rgba(4,16,30,0.95)_55%,rgba(4,10,22,0.98))]"
            : "absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(214,51,132,0.26),rgba(35,11,28,0.94)_55%,rgba(19,7,16,0.98))]"
        }
      />

      <div
        className={
          isRound
            ? "absolute top-[-12%] right-[-8%] h-[80%] w-[58%] border-l border-b border-cyan-300/35 bg-linear-to-bl from-cyan-400/20 to-transparent"
            : "absolute top-[-10%] left-[-10%] h-[82%] w-[60%] border-r border-b border-fuchsia-300/30 bg-linear-to-br from-fuchsia-400/20 to-transparent"
        }
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 82%, 22% 100%)" }}
      />

      <div
        className={
          isRound
            ? "absolute bottom-[-18%] left-[-8%] h-[72%] w-[62%] border-t border-r border-brm-secondary/30 bg-linear-to-tr from-lime-400/16 to-transparent"
            : "absolute bottom-[-20%] right-[-12%] h-[74%] w-[64%] border-t border-l border-brm-accent/30 bg-linear-to-tl from-brm-accent/16 to-transparent"
        }
        style={{ clipPath: "polygon(0 15%, 85% 0, 100% 100%, 0 100%)" }}
      />

      <motion.div
        className={
          isRound
            ? "absolute -left-24 top-10 h-10 w-80 -skew-x-12 bg-linear-to-r from-transparent via-cyan-100/25 to-transparent"
            : "absolute -left-24 top-8 h-10 w-80 -skew-x-12 bg-linear-to-r from-transparent via-fuchsia-200/25 to-transparent"
        }
        animate={{ x: [-40, 250] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }}
      />
    </div>
  );
}

export function BestOfRoundCard() {
  const { currentTournament, computedRound } = useTournamentContext();
  const [activeView, setActiveView] = useState<StatsViewKey>("round");
  const [snapshots, setSnapshots] = useState<Record<StatsViewKey, BestSnapshot>>(EMPTY_SNAPSHOT);
  const [isLoading, setIsLoading] = useState(true);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>({ exact_score_points: 5, correct_result_points: 2, incorrect_points: 0 });

  const goToNext = useCallback(() => setActiveView((prev) => rotateView(prev, 1)), []);
  const goToPrev = useCallback(() => setActiveView((prev) => rotateView(prev, -1)), []);
  const { dragProps } = useSwipeDrag({ onNext: goToNext, onPrev: goToPrev });

  useEffect(() => {
    const switchTimer = window.setInterval(() => {
      setActiveView((prev) => rotateView(prev, 1));
    }, 5200);

    return () => {
      window.clearInterval(switchTimer);
    };
  }, []);

  useEffect(() => {
    const fetchBestPerformers = async () => {
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

        const { data: matchesData } = await supabase
          .from("matches")
          .select("id, status, round_number")
          .eq("tournament_id", tournamentId)
          .is("deleted_at", null)
          .order("round_number", { ascending: true });

        type MatchRow = { id: string; status: string; round_number: number | null };
        type PredRow = {
          user_id: string;
          points_earned: number | null;
          is_exact_score: boolean | null;
          is_correct_result: boolean | null;
          match_id: string;
        };

        const matches = (matchesData as MatchRow[] | null) || [];
        const finishedMatches = matches.filter((match) => match.status === "finished");

        if (finishedMatches.length === 0) {
          setSnapshots({
            round: {
              ...EMPTY_SNAPSHOT.round,
              subtitle: `Rodada ${roundNumber}`,
            },
            tournament: {
              ...EMPTY_SNAPSHOT.tournament,
              subtitle: currentTournament.name,
            },
          });
          return;
        }

        const matchIds = finishedMatches.map((match) => match.id);

        const { data: predictionsData } = await supabase
          .from("predictions")
          .select("user_id, points_earned, is_exact_score, is_correct_result, match_id")
          .in("match_id", matchIds);

        const preds = (predictionsData as PredRow[] | null) || [];

        const aggregateTopPerformer = (scopedMatchIds: string[]): AggregatedPerformer | null => {
          if (scopedMatchIds.length === 0) return null;

          const scope = new Set(scopedMatchIds);
          const scopedPredictions = preds.filter((prediction) => scope.has(prediction.match_id));

          if (scopedPredictions.length === 0) return null;

          const byUser = new Map<string, AggregatedPerformer>();
          scopedPredictions.forEach((prediction) => {
            const current = byUser.get(prediction.user_id) || {
              userId: prediction.user_id,
              points: 0,
              predictions: 0,
              exactScores: 0,
              partialScores: 0,
            };

            current.points += resolvePredictionPoints(prediction, config);
            current.predictions += 1;
            if (prediction.is_exact_score) current.exactScores += 1;
            if (prediction.is_correct_result && !prediction.is_exact_score) current.partialScores += 1;
            byUser.set(prediction.user_id, current);
          });

          const ranked = [...byUser.values()].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
            if (b.partialScores !== a.partialScores) return b.partialScores - a.partialScores;
            return b.predictions - a.predictions;
          });

          return ranked[0] || null;
        };

        const roundMatchIds = finishedMatches
          .filter((match) => Number(match.round_number || 0) === roundNumber)
          .map((match) => match.id);

        const roundLeader = aggregateTopPerformer(roundMatchIds);
        const tournamentLeader = aggregateTopPerformer(matchIds);

        const leaderIds = [...new Set([roundLeader?.userId, tournamentLeader?.userId].filter(Boolean))] as string[];

        type ProfileRow = {
          id: string;
          first_name: string;
          last_name: string | null;
          avatar_url: string | null;
        };
        type UserRow = { id: string; favorite_team_id: string | null };
        type TeamRow = { id: string; name: string; logo_url: string | null };
        type RankingRow = { id: string; rank: number };

        let profileMap = new Map<string, ProfileRow>();
        let userMap = new Map<string, UserRow>();
        let teamMap = new Map<string, TeamRow>();
        let rankMap = new Map<string, number>();

        if (leaderIds.length > 0) {
          const [{ data: profilesData }, { data: usersData }, { data: rankingData }] = await Promise.all([
            supabase
              .from("user_profiles")
              .select("id, first_name, last_name, avatar_url")
              .in("id", leaderIds),
            supabase
              .from("users")
              .select("id, favorite_team_id")
              .in("id", leaderIds),
            supabase
              .from("global_ranking")
              .select("id, rank")
              .in("id", leaderIds),
          ]);

          const profiles = (profilesData as ProfileRow[] | null) || [];
          const users = (usersData as UserRow[] | null) || [];
          const rankings = (rankingData as RankingRow[] | null) || [];

          profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
          userMap = new Map(users.map((user) => [user.id, user]));
          rankMap = new Map(rankings.map((ranking) => [ranking.id, ranking.rank]));

          const teamIds = [...new Set(users.map((user) => user.favorite_team_id).filter(Boolean))] as string[];
          if (teamIds.length > 0) {
            const { data: teamsData } = await supabase
              .from("teams")
              .select("id, name, logo_url")
              .in("id", teamIds);

            const teams = (teamsData as TeamRow[] | null) || [];
            teamMap = new Map(teams.map((team) => [team.id, team]));
          }
        }

        const toSnapshotUser = (leader: AggregatedPerformer | null): BestUser | null => {
          if (!leader) return null;

          const profile = profileMap.get(leader.userId);
          if (!profile) return null;

          const favoriteTeamId = userMap.get(leader.userId)?.favorite_team_id || null;
          const favoriteTeam = favoriteTeamId ? teamMap.get(favoriteTeamId) : null;

          return {
            id: leader.userId,
            displayName: `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ""}`,
            avatarUrl: profile.avatar_url,
            favoriteTeamLogo: favoriteTeam
              ? favoriteTeam.logo_url || getTeamLogoPath(favoriteTeam.name)
              : null,
            points: leader.points,
            predictions: leader.predictions,
            exactScores: leader.exactScores,
            partialScores: leader.partialScores,
            rank: rankMap.get(leader.userId) ?? null,
          };
        };

        setSnapshots({
          round: {
            view: "round",
            title: "Melhor da rodada",
            subtitle: `Rodada ${roundNumber}`,
            performer: toSnapshotUser(roundLeader),
          },
          tournament: {
            view: "tournament",
            title: "Melhor do torneio",
            subtitle: currentTournament.name,
            performer: toSnapshotUser(tournamentLeader),
          },
        });
      } catch {
        setSnapshots(EMPTY_SNAPSHOT);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestPerformers();
  }, [currentTournament?.id, currentTournament?.name, computedRound]);

  if (isLoading) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <BestCardBackground view="round" />
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </div>
      </div>
    );
  }

  const snapshot = snapshots[activeView];
  const performer = snapshot.performer;
  const avatarSrc = performer?.avatarUrl || performer?.favoriteTeamLogo || null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BestCardBackground view={snapshot.view} />

      <motion.div className="absolute inset-0 z-10 flex flex-col" {...dragProps}>
        {/* Header: Tabs + Navigation */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-2 pt-2 sm:px-3 sm:pt-3">
          <Tabs
            selectedKey={activeView}
            onSelectionChange={(key) => setActiveView(key as StatsViewKey)}
            variant="secondary"
            className="w-full max-w-[140px] sm:max-w-[180px]"
          >
            <Tabs.ListContainer>
              <Tabs.List
                aria-label="Visualização do melhor jogador"
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
              onClick={() => setActiveView((prev) => rotateView(prev, -1))}
              className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center bg-black/40 text-brm-text-primary transition-colors hover:bg-black/60 hover:text-brm-primary"
            >
              <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Próxima visualização"
              onClick={() => setActiveView((prev) => rotateView(prev, 1))}
              className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center bg-black/40 text-brm-text-primary transition-colors hover:bg-black/60 hover:text-brm-accent"
            >
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={snapshot.view}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-1 min-h-0 flex-col sm:flex-row gap-1 sm:gap-1.5 px-2 sm:px-3"
          >
            {/* Left Column: Points */}
            <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-1 bg-black/30 px-2 py-1 sm:px-2 sm:py-1.5 sm:w-[70px] shrink-0">
              <div className="min-w-0">
                <p className="truncate text-[7px] sm:text-[8px] font-display font-bold uppercase tracking-wide text-brm-text-muted">
                  {snapshot.subtitle}
                </p>
                <p className="text-[8px] sm:text-[9px] font-display font-black uppercase text-brm-text-primary">Pontos</p>
              </div>

              <div className="text-right sm:text-left sm:mt-0.5">
                <p className="leading-none text-lg sm:text-xl font-display font-black text-brm-secondary">
                  {performer?.points || 0}
                </p>
                <div className="mt-0.5 inline-flex items-center gap-0.5 text-[6px] sm:text-[7px] font-display font-semibold uppercase text-yellow-300">
                  <Crown className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  <span>Destaque</span>
                </div>
              </div>
            </div>

            {/* Right Column: Performer Info + Stats */}
            <div className="flex flex-1 min-h-0 min-w-0 flex-col bg-black/20 px-1.5 py-1 sm:px-2 sm:py-1.5">
              {performer ? (
                <>
                  {/* Performer Header */}
                  <div className="flex items-start justify-between gap-1.5 shrink-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[8px] sm:text-[9px] font-display font-black uppercase tracking-wider text-brm-text-primary">
                        {snapshot.title}
                      </p>
                      <p className="truncate text-[7px] sm:text-[8px] font-display uppercase text-brm-text-muted">
                        {performer.displayName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-0.5 text-[6px] sm:text-[7px] text-brm-text-muted">
                        <Star className="h-2 w-2 text-brm-accent" />
                        <span className="font-display uppercase">
                          {performer.rank ? `#${performer.rank}` : "Sem rank"}
                        </span>
                      </div>
                    </div>

                    <div className="relative h-6 w-6 sm:h-8 sm:w-8 shrink-0 bg-black/40">
                      {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarSrc} alt={performer.displayName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[8px] sm:text-[10px] font-display font-black text-brm-text-muted">TOP</div>
                      )}
                      {performer.favoriteTeamLogo ? (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-brm-background-dark">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={performer.favoriteTeamLogo} alt="Time" className="h-full w-full object-cover" />
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="mt-1 sm:mt-1.5 grid grid-cols-3 gap-0.5 sm:gap-1 flex-1 min-h-0">
                    <div className="bg-black/25 px-1 py-1 sm:px-1.5 sm:py-1.5">
                      <p className="text-[6px] sm:text-[7px] font-display font-bold uppercase tracking-wide text-brm-text-muted">Exatos</p>
                      <p className="text-xs sm:text-sm leading-none font-display font-black text-brm-secondary">
                        {performer.exactScores}
                      </p>
                      <p className="text-[5px] sm:text-[6px] text-brm-text-muted">+{scoringConfig.exact_score_points}</p>
                    </div>

                    <div className="bg-black/25 px-1 py-1 sm:px-1.5 sm:py-1.5">
                      <p className="text-[6px] sm:text-[7px] font-display font-bold uppercase tracking-wide text-brm-text-muted">Parciais</p>
                      <p className="text-xs sm:text-sm leading-none font-display font-black text-brm-primary">
                        {performer.partialScores}
                      </p>
                      <p className="text-[5px] sm:text-[6px] text-brm-text-muted">+{scoringConfig.correct_result_points}</p>
                    </div>

                    <div className="bg-black/25 px-1 py-1 sm:px-1.5 sm:py-1.5">
                      <p className="text-[6px] sm:text-[7px] font-display font-bold uppercase tracking-wide text-brm-text-muted">Palpites</p>
                      <p className="text-xs sm:text-sm leading-none font-display font-black text-brm-text-primary">
                        {performer.predictions}
                      </p>
                      <p className="text-[5px] sm:text-[6px] text-brm-text-muted">totais</p>
                    </div>
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
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-[9px] sm:text-[10px] font-display uppercase tracking-wide text-brm-text-muted">
                    Aguardando resultados
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pagination Dots */}
        <div className="flex shrink-0 items-center justify-end gap-1 px-2 pb-1.5 sm:px-3 sm:pb-2">
          {VIEW_ORDER.map((view) => (
            <button
              key={view}
              type="button"
              aria-label={`Ir para ${view === "round" ? "rodada" : "torneio"}`}
              onClick={() => setActiveView(view)}
              className={`h-1 sm:h-1.5 transition-all ${activeView === view ? "w-4 sm:w-6 bg-brm-secondary" : "w-1.5 sm:w-2 bg-white/30"}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
