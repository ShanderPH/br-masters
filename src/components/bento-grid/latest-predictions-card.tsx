"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Loader2, Check, X, Star, Clock } from "lucide-react";
import { CompactVerticalTile } from "./bento-grid";
import { useTournamentContext } from "@/components/dashboard/tournament-context";
import { createClient } from "@/lib/supabase/client";
import { getScoringConfig, type ScoringConfig } from "@/lib/services/scoring-config";
import { getTeamLogoPath } from "@/lib/services/team-logo-service";

interface RecentPrediction {
  id: string;
  oddsId: string;
  username: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  favoriteTeamLogo: string | null;
  homeTeamCode: string | null;
  awayTeamCode: string | null;
  homeTeamGoals: number;
  awayTeamGoals: number;
  predictedAt: string;
  matchStatus: string;
  matchHomeScore: number | null;
  matchAwayScore: number | null;
  pointsEarned: number | null;
  isExactScore: boolean | null;
  isCorrectResult: boolean | null;
}

function PredictionItem({ prediction, index, scoringConfig }: { prediction: RecentPrediction; index: number; scoringConfig: ScoringConfig }) {
  const isFinished = prediction.matchStatus === "finished";
  const isPending = !isFinished;
  const isExact = prediction.isExactScore === true;
  const isCorrect = prediction.isCorrectResult === true && !isExact;
  const isWrong = isFinished && !isExact && !isCorrect;

  const initials = (prediction.firstName.charAt(0) + (prediction.lastName?.charAt(0) || "")).toUpperCase();
  const displayName = prediction.firstName + (prediction.lastName ? ` ${prediction.lastName.charAt(0)}.` : "");

  const avatarSrc = prediction.favoriteTeamLogo || prediction.avatarUrl;

  const getBgClass = () => {
    if (isExact) return "bg-gradient-to-r from-brm-secondary/20 to-brm-secondary/5 border-brm-secondary/40";
    if (isCorrect) return "bg-brm-primary/10 border-brm-primary/30";
    if (isWrong) return "bg-red-500/10 border-red-500/20";
    return "bg-white/5 border-white/10";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative flex items-center gap-2 py-1 px-2 border -skew-x-3 shrink-0 ${getBgClass()}`}
    >
      {isExact && (
        <motion.div
          className="absolute inset-0 bg-brm-secondary/10 -skew-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="skew-x-3 flex items-center gap-2 w-full relative z-10">
        <div className="w-6 h-6 rounded-full bg-brm-purple/30 border border-brm-purple/40 flex items-center justify-center shrink-0 overflow-hidden">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-display font-bold text-[8px] text-brm-purple-foreground">
              {initials}
            </span>
          )}
        </div>

        <span className="font-display font-bold text-[9px] text-brm-text-secondary truncate min-w-[40px]">
          {displayName}
        </span>

        <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 bg-black/20 rounded-sm">
          <span className="font-display font-bold text-[9px] text-brm-text-muted">
            {prediction.homeTeamCode || "???"}
          </span>
          <span className="font-display font-black text-[10px] text-brm-text-primary">
            {prediction.homeTeamGoals}×{prediction.awayTeamGoals}
          </span>
          <span className="font-display font-bold text-[9px] text-brm-text-muted">
            {prediction.awayTeamCode || "???"}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1 shrink-0">
          {isPending && (
            <Clock className="w-3 h-3 text-brm-text-muted" />
          )}
          {isExact && (
            <AnimatePresence>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-0.5 px-1 py-0.5 bg-brm-secondary/20 rounded"
              >
                <Star className="w-2.5 h-2.5 text-brm-secondary fill-brm-secondary" />
                <span className="font-display font-black text-[9px] text-brm-secondary">+{scoringConfig.exact_score_points}</span>
              </motion.div>
            </AnimatePresence>
          )}
          {isCorrect && (
            <div className="flex items-center gap-0.5 px-1 py-0.5 bg-brm-primary/20 rounded">
              <Check className="w-2.5 h-2.5 text-brm-primary" />
              <span className="font-display font-bold text-[9px] text-brm-primary">+{scoringConfig.correct_result_points}</span>
            </div>
          )}
          {isWrong && (
            <div className="flex items-center gap-0.5 px-1 py-0.5 bg-red-500/20 rounded">
              <X className="w-2.5 h-2.5 text-red-400" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function LatestPredictionsCard({ delay = 0 }: { delay?: number }) {
  const { currentTournament, computedRound } = useTournamentContext();
  const [predictions, setPredictions] = useState<RecentPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>({ exact_score_points: 5, correct_result_points: 2, incorrect_points: 0 });

  useEffect(() => {
    const fetchLatestPredictions = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const tournamentId = currentTournament?.id;
        const roundNumber = computedRound;

        const config = await getScoringConfig();
        setScoringConfig(config);

        if (!tournamentId || roundNumber <= 0) {
          setPredictions([]);
          setIsLoading(false);
          return;
        }

        const { data: matchesData } = await supabase
          .from("matches")
          .select("id, status, home_score, away_score, home_team:teams!matches_home_team_id_fkey(name_code), away_team:teams!matches_away_team_id_fkey(name_code)")
          .eq("tournament_id", tournamentId)
          .eq("round_number", roundNumber);

        type MatchDataRow = {
          id: string;
          status: string;
          home_score: number | null;
          away_score: number | null;
          home_team: { name_code: string | null } | null;
          away_team: { name_code: string | null } | null;
        };
        const matches = (matchesData as MatchDataRow[] | null) || [];

        if (matches.length === 0) {
          setPredictions([]);
          setIsLoading(false);
          return;
        }

        const matchIds = matches.map((m) => m.id);
        const matchMap = new Map(matches.map((m) => [m.id, m]));

        const { data: predsData } = await supabase
          .from("predictions")
          .select("id, user_id, match_id, home_team_goals, away_team_goals, predicted_at, points_earned, is_exact_score, is_correct_result")
          .in("match_id", matchIds)
          .order("predicted_at", { ascending: false })
          .limit(10);

        type PredRow = {
          id: string;
          user_id: string;
          match_id: string;
          home_team_goals: number;
          away_team_goals: number;
          predicted_at: string;
          points_earned: number | null;
          is_exact_score: boolean | null;
          is_correct_result: boolean | null;
        };

        const preds = (predsData as PredRow[] | null) || [];

        if (preds.length === 0) {
          setPredictions([]);
          setIsLoading(false);
          return;
        }

        const userIds = [...new Set(preds.map((p) => p.user_id))];

        const { data: usersData } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", userIds);

        const { data: userPrefsData } = await supabase
          .from("users")
          .select("id, favorite_team_id")
          .in("id", userIds);

        type UserRow = { id: string; first_name: string; last_name: string | null; avatar_url: string | null };
        type UserPrefRow = { id: string; favorite_team_id: string | null };

        const usersMap = new Map<string, UserRow>();
        ((usersData as UserRow[] | null) || []).forEach((u) => usersMap.set(u.id, u));

        const userPrefsMap = new Map<string, string | null>();
        ((userPrefsData as UserPrefRow[] | null) || []).forEach((u) => userPrefsMap.set(u.id, u.favorite_team_id));

        const favoriteTeamIds = [...new Set([...userPrefsMap.values()].filter(Boolean) as string[])];
        const teamsMap = new Map<string, string>();
        if (favoriteTeamIds.length > 0) {
          const { data: teamsData } = await supabase
            .from("teams")
            .select("id, name, logo_url")
            .in("id", favoriteTeamIds);

          type TeamRow = { id: string; name: string; logo_url: string | null };
          ((teamsData as TeamRow[] | null) || []).forEach((t) => {
            teamsMap.set(t.id, t.logo_url || getTeamLogoPath(t.name));
          });
        }

        const formatted: RecentPrediction[] = preds
          .filter((p) => usersMap.has(p.user_id))
          .map((p) => {
            const u = usersMap.get(p.user_id)!;
            const m = matchMap.get(p.match_id);
            const favTeamId = userPrefsMap.get(p.user_id);
            const favTeamLogo = favTeamId ? teamsMap.get(favTeamId) || null : null;

            return {
              id: p.id,
              oddsId: p.match_id,
              username: u.first_name,
              firstName: u.first_name,
              lastName: u.last_name,
              avatarUrl: u.avatar_url,
              favoriteTeamLogo: favTeamLogo,
              homeTeamCode: m?.home_team?.name_code || null,
              awayTeamCode: m?.away_team?.name_code || null,
              homeTeamGoals: p.home_team_goals,
              awayTeamGoals: p.away_team_goals,
              predictedAt: p.predicted_at,
              matchStatus: m?.status || "scheduled",
              matchHomeScore: m?.home_score ?? null,
              matchAwayScore: m?.away_score ?? null,
              pointsEarned: p.points_earned,
              isExactScore: p.is_exact_score,
              isCorrectResult: p.is_correct_result,
            };
          });

        setPredictions(formatted);
      } catch {
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestPredictions();
  }, [currentTournament?.id, computedRound]);

  if (isLoading) {
    return (
      <CompactVerticalTile colorTheme="purple" delay={delay}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-5 h-5 animate-spin text-brm-purple" />
        </div>
      </CompactVerticalTile>
    );
  }

  return (
    <CompactVerticalTile colorTheme="purple" delay={delay}>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-1.5 shrink-0">
          <div className="w-5 h-5 flex items-center justify-center bg-brm-purple/20 -skew-x-6">
            <MessageSquare className="w-3 h-3 text-purple-400 skew-x-6" />
          </div>
          <h3 className="font-display text-[10px] sm:text-xs text-purple-400 font-black uppercase italic tracking-wide">
            Últimos Palpites
          </h3>
        </div>

        <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar min-h-0">
          {predictions.length === 0 ? (
            <p className="text-[10px] text-brm-text-muted font-display text-center py-3">
              Nenhum palpite recente
            </p>
          ) : (
            predictions.map((pred, i) => (
              <PredictionItem key={pred.id} prediction={pred} index={i} scoringConfig={scoringConfig} />
            ))
          )}
        </div>
      </div>
    </CompactVerticalTile>
  );
}
