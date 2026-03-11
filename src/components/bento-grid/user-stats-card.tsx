"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Trophy, Loader2 } from "lucide-react";
import { StandardTile } from "./bento-grid";
import { createClient } from "@/lib/supabase/client";
import { useTournamentContext } from "@/components/dashboard/tournament-context";
import { getScoringConfig, type ScoringConfig } from "@/lib/services/scoring-config";

interface UserStatsCardProps {
  stats?: {
    predictions: number;
    accuracy: number;
    points: number;
    exactScores?: number;
    correctResults?: number;
  };
  delay?: number;
  isLoading?: boolean;
  scoringConfig?: ScoringConfig;
}

export function UserStatsCard({ stats, delay = 0, isLoading = false, scoringConfig }: UserStatsCardProps) {
  if (isLoading) {
    return (
      <StandardTile colorTheme="blue" delay={delay}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-brm-primary" />
        </div>
      </StandardTile>
    );
  }

  return (
    <StandardTile colorTheme="blue" delay={delay}>
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 flex items-center justify-center bg-brm-primary/20 -skew-x-6">
            <TrendingUp className="w-3.5 h-3.5 text-brm-primary skew-x-6" />
          </div>
          <h3 className="font-display text-xs text-brm-primary font-black uppercase italic tracking-wide">
            Seu Desempenho
          </h3>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-2">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-2 bg-yellow-500/10 border-l-2 border-yellow-500 -skew-x-3"
          >
            <div className="skew-x-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-display text-[10px] text-yellow-400 font-bold uppercase">
                Pontos
              </span>
            </div>
            <span className="skew-x-3 font-display font-black text-xl text-yellow-400 italic">
              {stats?.points || 0}
            </span>
          </motion.div>

          <div className="grid grid-cols-2 gap-1.5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-1.5 bg-white/5 border-l-2 border-brm-primary -skew-x-3"
            >
              <div className="skew-x-3">
                <span className="font-display text-[9px] text-brm-text-muted dark:text-gray-500 uppercase block">
                  Palpites
                </span>
                <span className="font-display font-bold text-sm text-brm-text-primary dark:text-white">
                  {stats?.predictions || 0}
                </span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-1.5 bg-white/5 border-l-2 border-brm-secondary -skew-x-3"
            >
              <div className="skew-x-3">
                <span className="font-display text-[9px] text-brm-text-muted dark:text-gray-500 uppercase block">
                  Acertos
                </span>
                <span className="font-display font-bold text-sm text-brm-secondary">
                  {stats?.accuracy || 0}%
                </span>
              </div>
            </motion.div>
          </div>

          {(stats?.exactScores !== undefined || stats?.correctResults !== undefined) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between pt-1 border-t border-slate-700/50"
            >
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-brm-secondary" />
                <span className="font-display text-[9px] text-brm-text-muted dark:text-gray-400">
                  {stats?.exactScores || 0} exatos {scoringConfig && <span className="text-brm-secondary">(+{scoringConfig.exact_score_points})</span>}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-brm-primary" />
                <span className="font-display text-[9px] text-brm-text-muted dark:text-gray-400">
                  {stats?.correctResults || 0} result. {scoringConfig && <span className="text-brm-primary">(+{scoringConfig.correct_result_points})</span>}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </StandardTile>
  );
}

export function UserStatsCardWithData({
  currentUserId,
  delay = 0,
}: {
  currentUserId?: string;
  delay?: number;
}) {
  const { currentTournament, computedRound } = useTournamentContext();
  const [stats, setStats] = useState({
    predictions: 0,
    accuracy: 0,
    points: 0,
    exactScores: 0,
    correctResults: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>({ exact_score_points: 5, correct_result_points: 2, incorrect_points: 0 });

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const supabase = createClient();
        const tournamentId = currentTournament?.id;
        const roundNumber = computedRound;

        const config = await getScoringConfig();
        setScoringConfig(config);

        if (tournamentId && roundNumber > 0) {
          const { data: matchesData } = await supabase
            .from("matches")
            .select("id, status")
            .eq("tournament_id", tournamentId)
            .eq("round_number", roundNumber);

          type MatchIdRow = { id: string; status: string };
          const matches = (matchesData as MatchIdRow[] | null) || [];
          const matchIds = matches.map((m) => m.id);
          const finishedMatchIds = matches.filter((m) => m.status === "finished").map((m) => m.id);

          if (matchIds.length > 0) {
            const { data: predsData } = await supabase
              .from("predictions")
              .select("points_earned, is_exact_score, is_correct_result, match_id")
              .eq("user_id", currentUserId)
              .in("match_id", matchIds);

            type PredRow = {
              points_earned: number | null;
              is_exact_score: boolean | null;
              is_correct_result: boolean | null;
              match_id: string;
            };

            const preds = (predsData as PredRow[] | null) || [];
            const totalPredictions = preds.length;
            
            const finishedPreds = preds.filter((p) => finishedMatchIds.includes(p.match_id));
            const exactScores = finishedPreds.filter((p) => p.is_exact_score).length;
            const correctResults = finishedPreds.filter(
              (p) => p.is_correct_result && !p.is_exact_score
            ).length;
            const points = finishedPreds.reduce((acc, p) => acc + (p.points_earned || 0), 0);
            
            const totalFinished = finishedPreds.length;
            const fullHits = exactScores;
            const halfHits = correctResults;
            const weightedAccuracy = totalFinished > 0
              ? Math.round(((fullHits * 1 + halfHits * 0.5) / totalFinished) * 100)
              : 0;

            setStats({
              predictions: totalPredictions,
              accuracy: Math.min(weightedAccuracy, 100),
              points,
              exactScores,
              correctResults,
            });
          } else {
            setStats({ predictions: 0, accuracy: 0, points: 0, exactScores: 0, correctResults: 0 });
          }
        } else {
          const { data: profileData } = await supabase
            .from("user_profiles")
            .select("total_points, predictions_count, correct_predictions, exact_score_predictions")
            .eq("id", currentUserId)
            .single();

          type ProfileRow = {
            total_points: number;
            predictions_count: number;
            correct_predictions: number;
            exact_score_predictions: number;
          };

          const profile = profileData as ProfileRow | null;

          if (profile) {
            const fullHits = profile.exact_score_predictions || 0;
            const halfHits = profile.correct_predictions || 0;
            const totalPreds = profile.predictions_count || 0;
            const weightedAccuracy = totalPreds > 0
              ? Math.round(((fullHits * 1 + halfHits * 0.5) / totalPreds) * 100)
              : 0;

            setStats({
              predictions: totalPreds,
              accuracy: Math.min(weightedAccuracy, 100),
              points: profile.total_points || 0,
              exactScores: fullHits,
              correctResults: halfHits,
            });
          }
        }
      } catch {
        // Keep default stats
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [currentUserId, currentTournament?.id, computedRound]);

  return <UserStatsCard stats={stats} delay={delay} isLoading={isLoading} scoringConfig={scoringConfig} />;
}
