"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Target, Star, TrendingUp, Loader2 } from "lucide-react";
import { StandardTile } from "./bento-grid";
import { useTournamentContext } from "@/components/dashboard/tournament-context";
import { createClient } from "@/lib/supabase/client";
import { getScoringConfig, type ScoringConfig } from "@/lib/services/scoring-config";
import { getTeamLogoPath } from "@/lib/services/team-logo-service";

interface BestUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  favoriteTeamLogo: string | null;
  roundPoints: number;
  exactScores: number;
  correctResults: number;
  rank: number;
}

export function BestOfRoundCard({ delay = 0 }: { delay?: number }) {
  const { currentTournament, computedRound } = useTournamentContext();
  const [bestUser, setBestUser] = useState<BestUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>({ exact_score_points: 5, correct_result_points: 2, incorrect_points: 0 });

  useEffect(() => {
    const fetchBestOfRound = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const tournamentId = currentTournament?.id;
        const roundNumber = computedRound;

        const config = await getScoringConfig();
        setScoringConfig(config);

        if (!tournamentId || roundNumber <= 0) {
          setBestUser(null);
          setIsLoading(false);
          return;
        }

        const { data: matchesData } = await supabase
          .from("matches")
          .select("id")
          .eq("tournament_id", tournamentId)
          .eq("round_number", roundNumber)
          .eq("status", "finished");

        type MatchIdRow = { id: string };
        const finishedMatches = (matchesData as MatchIdRow[] | null) || [];

        if (finishedMatches.length === 0) {
          setBestUser(null);
          setIsLoading(false);
          return;
        }

        const matchIds = finishedMatches.map((m) => m.id);

        const { data: predictionsData } = await supabase
          .from("predictions")
          .select("user_id, points_earned, is_exact_score, is_correct_result")
          .in("match_id", matchIds);

        type PredRow = {
          user_id: string;
          points_earned: number | null;
          is_exact_score: boolean | null;
          is_correct_result: boolean | null;
        };

        const preds = (predictionsData as PredRow[] | null) || [];

        const userScores = new Map<string, { points: number; exact: number; correct: number }>();
        preds.forEach((p) => {
          const existing = userScores.get(p.user_id) || { points: 0, exact: 0, correct: 0 };
          existing.points += p.points_earned || 0;
          if (p.is_exact_score) existing.exact += 1;
          if (p.is_correct_result && !p.is_exact_score) existing.correct += 1;
          userScores.set(p.user_id, existing);
        });

        if (userScores.size === 0) {
          setBestUser(null);
          setIsLoading(false);
          return;
        }

        let topUserId = "";
        let topScore = { points: 0, exact: 0, correct: 0 };
        userScores.forEach((score, userId) => {
          if (
            score.points > topScore.points ||
            (score.points === topScore.points && score.exact > topScore.exact)
          ) {
            topUserId = userId;
            topScore = score;
          }
        });

        if (!topUserId || topScore.points === 0) {
          setBestUser(null);
          setIsLoading(false);
          return;
        }

        const { data: userData } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name, avatar_url")
          .eq("id", topUserId)
          .single();

        const { data: userPrefsData } = await supabase
          .from("users")
          .select("id, favorite_team_id")
          .eq("id", topUserId)
          .single();

        const { data: rankingData } = await supabase
          .from("global_ranking")
          .select("rank")
          .eq("id", topUserId)
          .single();

        type UserRow = {
          id: string;
          first_name: string;
          last_name: string | null;
          avatar_url: string | null;
        };
        type UserPrefRow = { id: string; favorite_team_id: string | null };
        type RankRow = { rank: number };

        const userInfo = userData as UserRow | null;
        const userPrefs = userPrefsData as UserPrefRow | null;
        const rankInfo = rankingData as RankRow | null;

        let favoriteTeamLogo: string | null = null;
        if (userPrefs?.favorite_team_id) {
          const { data: teamData } = await supabase
            .from("teams")
            .select("id, name, logo_url")
            .eq("id", userPrefs.favorite_team_id)
            .single();

          type TeamRow = { id: string; name: string; logo_url: string | null };
          const team = teamData as TeamRow | null;
          if (team) {
            favoriteTeamLogo = team.logo_url || getTeamLogoPath(team.name);
          }
        }

        if (userInfo) {
          setBestUser({
            id: userInfo.id,
            username: userInfo.first_name,
            firstName: userInfo.first_name,
            lastName: userInfo.last_name,
            avatarUrl: userInfo.avatar_url,
            favoriteTeamLogo,
            roundPoints: topScore.points,
            exactScores: topScore.exact,
            correctResults: topScore.correct,
            rank: Number(rankInfo?.rank) || 0,
          });
        }
      } catch {
        setBestUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestOfRound();
  }, [currentTournament?.id, computedRound]);

  if (isLoading) {
    return (
      <StandardTile colorTheme="gold" delay={delay}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
        </div>
      </StandardTile>
    );
  }

  if (!bestUser) {
    return (
      <StandardTile colorTheme="gold" delay={delay}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 flex items-center justify-center bg-yellow-500/20 -skew-x-6">
              <Crown className="w-3.5 h-3.5 text-yellow-400 skew-x-6" />
            </div>
            <h3 className="font-display text-xs text-yellow-400 font-black uppercase italic tracking-wide">
              Melhor da Rodada
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] text-brm-text-muted font-display">
              Aguardando resultados
            </p>
          </div>
        </div>
      </StandardTile>
    );
  }

  const displayName = bestUser.firstName + (bestUser.lastName ? ` ${bestUser.lastName.charAt(0)}.` : "");
  const initials = (bestUser.firstName.charAt(0) + (bestUser.lastName?.charAt(0) || "")).toUpperCase();
  const avatarSrc = bestUser.favoriteTeamLogo || bestUser.avatarUrl;

  return (
    <StandardTile colorTheme="gold" delay={delay}>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 flex items-center justify-center bg-yellow-500/20 -skew-x-6">
            <Crown className="w-3.5 h-3.5 text-yellow-400 skew-x-6" />
          </div>
          <h3 className="font-display text-xs text-yellow-400 font-black uppercase italic tracking-wide">
            Melhor da Rodada
          </h3>
        </div>

        <div className="flex-1 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 border-2 border-yellow-500/40 flex items-center justify-center overflow-hidden">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display font-black text-sm text-yellow-400 italic">
                  {initials}
                </span>
              )}
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
              <Crown className="w-3 h-3 text-brm-background-dark" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-brm-text-primary truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-0.5 bg-yellow-500/15 px-1.5 py-0.5 -skew-x-3"
              >
                <TrendingUp className="w-3 h-3 text-yellow-400 skew-x-3" />
                <span className="font-display font-black text-xs text-yellow-400 italic skew-x-3">
                  {bestUser.roundPoints}pts
                </span>
              </motion.div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-brm-secondary" />
                <span className="font-display text-[9px] text-brm-text-muted">
                  {bestUser.exactScores} <span className="text-brm-secondary">(+{scoringConfig.exact_score_points})</span>
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <Target className="w-2.5 h-2.5 text-brm-primary" />
                <span className="font-display text-[9px] text-brm-text-muted">
                  {bestUser.correctResults} <span className="text-brm-primary">(+{scoringConfig.correct_result_points})</span>
                </span>
              </div>
              <span className="font-display text-[9px] text-brm-text-muted">
                #{bestUser.rank}
              </span>
            </div>
          </div>
        </div>
      </div>
    </StandardTile>
  );
}
