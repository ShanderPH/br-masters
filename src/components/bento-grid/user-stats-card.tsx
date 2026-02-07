"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Trophy, Loader2 } from "lucide-react";
import { StandardTile } from "./bento-grid";
import { createClient } from "@/lib/supabase/client";

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
}

export function UserStatsCard({ stats, delay = 0, isLoading = false }: UserStatsCardProps) {
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
                  {stats?.exactScores || 0} exatos
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-brm-primary" />
                <span className="font-display text-[9px] text-brm-text-muted dark:text-gray-400">
                  {stats?.correctResults || 0} resultados
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
  const [stats, setStats] = useState({
    predictions: 0,
    accuracy: 0,
    points: 0,
    exactScores: 0,
    correctResults: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();

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
          const totalCorrect = profile.correct_predictions + profile.exact_score_predictions;
          const accuracy =
            profile.predictions_count > 0
              ? Math.round((totalCorrect / profile.predictions_count) * 100)
              : 0;

          setStats({
            predictions: profile.predictions_count || 0,
            accuracy: Math.min(accuracy, 100),
            points: profile.total_points || 0,
            exactScores: profile.exact_score_predictions || 0,
            correctResults: profile.correct_predictions || 0,
          });
        }
      } catch {
        // Keep default stats
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [currentUserId]);

  return <UserStatsCard stats={stats} delay={delay} isLoading={isLoading} />;
}
