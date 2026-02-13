"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Crown,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { VerticalTile } from "./bento-grid";
import { createClient } from "@/lib/supabase/client";
import { useTournamentContext } from "@/components/dashboard/tournament-context";

interface RankingUser {
  id: string;
  name: string;
  points: number;
  rank: number;
  previousRank?: number | null;
  teamLogo?: string | null;
  teamName?: string | null;
  totalPoints?: number;
}

interface RankingItem {
  id: string;
  type: "general" | "tournament" | "round";
  title: string;
  subtitle?: string;
  logo?: string;
  users: RankingUser[];
}

const RankChangeIndicator = ({ rank, previousRank }: { rank: number; previousRank?: number | null }) => {
  if (!previousRank || previousRank === rank) {
    return <Minus className="w-2.5 h-2.5 text-gray-500" />;
  }
  const diff = previousRank - rank;
  if (diff > 0) {
    return (
      <div className="flex items-center gap-0.5">
        <TrendingUp className="w-2.5 h-2.5 text-green-400" />
        <span className="text-[8px] font-bold text-green-400 tabular-nums">+{diff}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      <TrendingDown className="w-2.5 h-2.5 text-red-400" />
      <span className="text-[8px] font-bold text-red-400 tabular-nums">{diff}</span>
    </div>
  );
};

const PositionIcon = ({
  position,
  isCurrentUser,
}: {
  position: number;
  isCurrentUser: boolean;
}) => {
  if (position === 1) return <Crown className="w-3 h-3 text-yellow-400" />;
  if (position === 2) return <Medal className="w-3 h-3 text-gray-300" />;
  if (position === 3) return <Award className="w-3 h-3 text-amber-500" />;
  return (
    <span
      className={`font-display font-black text-[10px] tabular-nums ${isCurrentUser ? "text-brm-secondary" : "text-gray-500"}`}
    >
      {position}
    </span>
  );
};

const UserItem = ({
  user,
  isCurrentUser,
  index,
  showRankChange = false,
}: {
  user: RankingUser;
  isCurrentUser: boolean;
  index: number;
  showRankChange?: boolean;
}) => {
  const position = user.rank;
  const isTop3 = position <= 3;

  const getBgColor = () => {
    if (isCurrentUser) return "bg-brm-secondary/20";
    if (position === 1) return "bg-linear-to-r from-yellow-500/30 to-yellow-600/20";
    if (position === 2) return "bg-linear-to-r from-gray-400/20 to-gray-500/10";
    if (position === 3) return "bg-linear-to-r from-amber-600/20 to-amber-700/10";
    return "bg-brm-card/50 dark:bg-slate-800/50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <div
        className={`
          flex items-center gap-1.5 py-0.5 sm:py-1 px-2
          transition-all duration-300
          -skew-x-6
          ${getBgColor()}
          ${isTop3 || isCurrentUser ? "border-l-2" : ""}
          ${position === 1 ? "border-l-yellow-400" : ""}
          ${position === 2 ? "border-l-gray-300" : ""}
          ${position === 3 ? "border-l-amber-600" : ""}
          ${isCurrentUser && !isTop3 ? "border-l-brm-secondary" : ""}
        `}
      >
        <div className="flex items-center gap-1.5 w-full skew-x-6">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            <PositionIcon position={position} isCurrentUser={isCurrentUser} />
          </div>

          <div className="relative w-4 h-4 shrink-0">
            {user.teamLogo ? (
              <Image
                src={user.teamLogo}
                alt={user.teamName || "Team"}
                fill
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full bg-brm-text-muted dark:bg-gray-700 rounded-full" />
            )}
          </div>

          <span
            className={`flex-1 font-display font-bold text-[10px] uppercase truncate ${isCurrentUser ? "text-brm-secondary" : "text-brm-text-primary dark:text-white"}`}
          >
            {user.name}
          </span>

          {showRankChange && (
            <div className="shrink-0">
              <RankChangeIndicator rank={user.rank} previousRank={user.previousRank} />
            </div>
          )}

          <span
            className={`
              font-display font-black text-xs tabular-nums shrink-0
              ${position === 1 ? "text-yellow-400" : "text-brm-text-primary dark:text-white"}
              ${isCurrentUser ? "text-brm-secondary" : ""}
            `}
          >
            {user.points}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export function RankingCardWithData({
  currentUserId,
  delay = 0,
}: {
  currentUserId?: string;
  delay?: number;
}) {
  const router = useRouter();
  const { currentTournament, computedRound } = useTournamentContext();
  const [carouselItems, setCarouselItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const items: RankingItem[] = [];

        const { data: usersData } = await supabase
          .from("users_profiles")
          .select("id, name, points, favorite_team_logo")
          .order("points", { ascending: false })
          .limit(10);

        type UserRow = {
          id: string;
          name: string;
          points: number;
          favorite_team_logo: string | null;
        };

        const users = (usersData as UserRow[] | null) || [];

        if (users.length > 0) {
          const generalRanking: RankingUser[] = users.map((u, idx) => ({
            id: u.id,
            name: u.name || "Jogador",
            points: u.points || 0,
            rank: idx + 1,
            teamLogo: u.favorite_team_logo || null,
          }));

          items.push({
            id: "general",
            type: "general",
            title: "Ranking",
            subtitle: "Geral",
            users: generalRanking.slice(0, 10),
          });
        }

        if (currentTournament) {
          const { data: tournamentRanking } = await supabase
            .from("user_tournament_points")
            .select("user_id, points, previous_rank")
            .eq("tournament_id", currentTournament.id)
            .order("points", { ascending: false })
            .limit(10);

          type TournamentRankRow = {
            user_id: string;
            points: number;
            previous_rank: number | null;
          };

          const tRanking = (tournamentRanking as TournamentRankRow[] | null) || [];

          if (tRanking.length > 0) {
            const userIds = tRanking.map((r) => r.user_id);
            const { data: profilesData } = await supabase
              .from("users_profiles")
              .select("id, firebase_id, name, favorite_team_logo")
              .in("firebase_id", userIds);

            type ProfileRow = {
              id: string;
              firebase_id: string;
              name: string;
              favorite_team_logo: string | null;
            };

            const profiles = (profilesData as ProfileRow[] | null) || [];
            const profileMap = new Map(profiles.map((p) => [p.firebase_id, p]));

            const tournamentUsers: RankingUser[] = tRanking.map((r, idx) => {
              const profile = profileMap.get(r.user_id);
              return {
                id: r.user_id,
                name: profile?.name || "Jogador",
                points: r.points || 0,
                rank: idx + 1,
                previousRank: r.previous_rank,
                teamLogo: profile?.favorite_team_logo || null,
              };
            });

            items.push({
              id: `tournament-${currentTournament.id}`,
              type: "tournament",
              title: currentTournament.short_name || currentTournament.name,
              subtitle: "Campeonato",
              logo: currentTournament.logo_url,
              users: tournamentUsers,
            });
          }

          if (computedRound > 0) {
            const { data: roundRanking } = await supabase
              .from("user_round_points")
              .select("user_id, points, rank, previous_rank")
              .eq("tournament_id", currentTournament.id)
              .eq("round_number", computedRound)
              .order("points", { ascending: false })
              .limit(10);

            type RoundRankRow = {
              user_id: string;
              points: number;
              rank: number | null;
              previous_rank: number | null;
            };

            const rRanking = (roundRanking as RoundRankRow[] | null) || [];

            if (rRanking.length > 0) {
              const userIds = rRanking.map((r) => r.user_id);
              const { data: profilesData } = await supabase
                .from("users_profiles")
                .select("id, firebase_id, name, favorite_team_logo")
                .in("firebase_id", userIds);

              type ProfileRow = {
                id: string;
                firebase_id: string;
                name: string;
                favorite_team_logo: string | null;
              };

              const profiles = (profilesData as ProfileRow[] | null) || [];
              const profileMap = new Map(profiles.map((p) => [p.firebase_id, p]));

              const roundUsers: RankingUser[] = rRanking.map((r, idx) => {
                const profile = profileMap.get(r.user_id);
                return {
                  id: r.user_id,
                  name: profile?.name || "Jogador",
                  points: r.points || 0,
                  rank: r.rank || idx + 1,
                  previousRank: r.previous_rank,
                  teamLogo: profile?.favorite_team_logo || null,
                };
              });

              items.push({
                id: `round-${currentTournament.id}-${computedRound}`,
                type: "round",
                title: `Rodada ${computedRound}`,
                subtitle: currentTournament.short_name || currentTournament.name,
                logo: currentTournament.logo_url,
                users: roundUsers,
              });
            }
          }
        }

        if (items.length === 0) {
          items.push({
            id: "general",
            type: "general",
            title: "Ranking",
            subtitle: "Geral",
            users: [],
          });
        }

        setCarouselItems(items);
        setCurrentIndex(0);
      } catch {
        setCarouselItems([
          { id: "general", type: "general", title: "Ranking", subtitle: "Geral", users: [] },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [currentTournament, computedRound]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  }, [carouselItems.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  }, [carouselItems.length]);

  const handleNavigateToRanking = () => {
    const currentItem = carouselItems[currentIndex];
    if (currentItem?.type === "tournament") {
      const tournamentId = currentItem.id.replace("tournament-", "");
      router.push(`/ranking?tournament=${tournamentId}`);
    } else {
      router.push("/ranking");
    }
  };

  if (loading) {
    return (
      <VerticalTile colorTheme="purple" delay={delay}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-brm-purple" />
        </div>
      </VerticalTile>
    );
  }

  if (carouselItems.length === 0) {
    return (
      <VerticalTile title="Ranking" subtitle="Geral" colorTheme="purple" delay={delay}>
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Trophy className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-xs text-center text-brm-text-muted">Nenhum ranking disponível</p>
        </div>
      </VerticalTile>
    );
  }

  const currentItem = carouselItems[currentIndex];
  const isGeneralRanking = currentItem?.type === "general";
  const showRankChange = currentItem?.type === "tournament";

  return (
    <VerticalTile
      title={currentItem?.title || "Ranking"}
      subtitle={currentItem?.subtitle}
      colorTheme={isGeneralRanking ? "purple" : currentItem?.type === "round" ? "lime" : "blue"}
      delay={delay}
      onClick={handleNavigateToRanking}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            {currentItem?.logo ? (
              <div className="relative w-5 h-5">
                <Image
                  src={currentItem.logo}
                  alt={currentItem.title}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <Trophy
                className={`w-4 h-4 ${isGeneralRanking ? "text-brm-purple" : "text-brm-primary"}`}
              />
            )}
          </div>

          {carouselItems.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-3 h-3 text-gray-400" />
              </button>
              <span className="text-[9px] text-gray-500 font-display tabular-nums">
                {currentIndex + 1}/{carouselItems.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-0.5"
            >
              {currentItem?.users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <Trophy className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs text-brm-text-muted">Sem participantes ainda</p>
                </div>
              ) : (
                currentItem?.users.map((user, index) => (
                  <UserItem
                    key={user.id}
                    user={user}
                    isCurrentUser={user.id === currentUserId}
                    index={index}
                    showRankChange={showRankChange}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {carouselItems.length > 1 && (
          <div className="flex items-center justify-center gap-1 mt-1.5 shrink-0">
            {carouselItems.map((item, index) => (
              <button
                key={item.id}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                className={`
                  h-1.5 rounded-full transition-all duration-300
                  ${
                    index === currentIndex
                      ? item.type === "general"
                        ? "bg-brm-purple w-4"
                        : item.type === "round"
                          ? "bg-brm-secondary w-4"
                          : "bg-brm-primary w-4"
                      : "bg-gray-600 hover:bg-gray-500 w-1.5"
                  }
                `}
                aria-label={`Ver ${item.title}`}
              />
            ))}
          </div>
        )}

        <div className="mt-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); handleNavigateToRanking(); }}
            className={`
              w-full py-2 cursor-pointer
              ${
                isGeneralRanking
                  ? "bg-brm-purple/20 hover:bg-brm-purple/40 text-brm-text-primary hover:text-white"
                  : "bg-brm-primary/20 hover:bg-brm-primary/40 text-brm-text-primary hover:text-white"
              }
              text-[10px] font-display font-bold uppercase
              transition-colors duration-300
              flex items-center justify-center gap-1
              -skew-x-6
            `}
          >
            <span className="skew-x-6 flex items-center gap-1">
              Ver Ranking Completo
              <ChevronRight className="w-3 h-3" />
            </span>
          </motion.button>
        </div>
      </div>
    </VerticalTile>
  );
}
