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
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { VerticalTile } from "./bento-grid";
import { createClient } from "@/lib/supabase/client";

interface RankingUser {
  id: string;
  name: string;
  points: number;
  rank: number;
  teamLogo?: string | null;
  teamName?: string | null;
  totalPoints?: number;
}

interface RankingItem {
  id: string;
  type: "general" | "tournament";
  title: string;
  subtitle?: string;
  logo?: string;
  users: RankingUser[];
}

interface RankingCardProps {
  currentUserId?: string;
  delay?: number;
  autoPlayInterval?: number;
}

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
      className={`font-display font-black text-[10px] ${isCurrentUser ? "text-brm-secondary" : "text-gray-500"}`}
    >
      {position}
    </span>
  );
};

const UserItem = ({
  user,
  isCurrentUser,
  index,
  showTotalPoints = false,
}: {
  user: RankingUser;
  isCurrentUser: boolean;
  index: number;
  showTotalPoints?: boolean;
}) => {
  const position = user.rank;
  const isTop3 = position <= 3;

  const getBgColor = () => {
    if (isCurrentUser) return "bg-brm-secondary/20";
    if (position === 1) return "bg-linear-to-r from-yellow-500/30 to-yellow-600/20";
    if (position === 2) return "bg-linear-to-r from-gray-400/20 to-gray-500/10";
    if (position === 3) return "bg-linear-to-r from-amber-600/20 to-amber-700/10";
    return "bg-brm-card/50 dark:bg-slate-800/50 hover:bg-brm-card-elevated/50 dark:hover:bg-slate-700/50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="relative"
    >
      <div
        className={`
          flex items-center gap-1.5 py-1 px-2
          transition-all duration-300
          -skew-x-6
          ${getBgColor()}
          ${isTop3 ? "border-l-2" : ""}
          ${position === 1 ? "border-l-yellow-400" : ""}
          ${position === 2 ? "border-l-gray-300" : ""}
          ${position === 3 ? "border-l-amber-600" : ""}
          ${isCurrentUser ? "border-l-brm-secondary border-l-2" : ""}
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

          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`
                font-display font-black text-xs tabular-nums
                ${position === 1 ? "text-yellow-400" : "text-brm-text-primary dark:text-white"}
                ${isCurrentUser ? "text-brm-secondary" : ""}
              `}
            >
              {user.points}
            </span>
            {showTotalPoints &&
              user.totalPoints !== undefined &&
              user.totalPoints !== user.points && (
                <span className="text-[8px] text-brm-text-muted dark:text-gray-500">/{user.totalPoints}</span>
              )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CarouselIndicator = ({
  items,
  currentIndex,
  onSelect,
}: {
  items: RankingItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1 mt-2">
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => onSelect(index)}
          className={`
            w-1.5 h-1.5 rounded-full transition-all duration-300
            ${
              index === currentIndex
                ? item.type === "general"
                  ? "bg-brm-purple w-3"
                  : "bg-brm-primary w-3"
                : "bg-gray-600 hover:bg-gray-500"
            }
          `}
          aria-label={`Ver ${item.title}`}
        />
      ))}
    </div>
  );
};

export function RankingCard({
  currentUserId,
  delay = 0,
  autoPlayInterval = 5000,
}: RankingCardProps) {
  const router = useRouter();
  const [carouselItems, setCarouselItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const supabase = createClient();

        const { data: usersData } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name, total_points, avatar_url")
          .eq("is_public", true)
          .order("total_points", { ascending: false })
          .limit(10);

        type UserRow = {
          id: string;
          first_name: string;
          last_name: string | null;
          total_points: number;
          avatar_url: string | null;
        };

        const users = usersData as UserRow[] | null;

        const items: RankingItem[] = [];

        if (users && users.length > 0) {
          const { data: usersWithTeams } = await supabase
            .from("users")
            .select("id, favorite_team_id")
            .in(
              "id",
              users.map((u) => u.id)
            );

          type UserTeamRow = {
            id: string;
            favorite_team_id: string | null;
          };

          const userTeams = usersWithTeams as UserTeamRow[] | null;
          const teamIds = userTeams
            ?.filter((u) => u.favorite_team_id)
            .map((u) => u.favorite_team_id as string) || [];

          const teamsMap = new Map<string, { name: string; logo_url: string | null }>();

          if (teamIds.length > 0) {
            const { data: teamsData } = await supabase
              .from("teams")
              .select("id, name, logo_url")
              .in("id", teamIds);

            type TeamRow = {
              id: string;
              name: string;
              logo_url: string | null;
            };

            const teams = teamsData as TeamRow[] | null;
            if (teams) {
              teams.forEach((t) => teamsMap.set(t.id, { name: t.name, logo_url: t.logo_url }));
            }
          }

          const userTeamsMap = new Map<string, string | null>();
          if (userTeams) {
            userTeams.forEach((u) => userTeamsMap.set(u.id, u.favorite_team_id));
          }

          const generalRanking: RankingUser[] = users.map((u, idx) => {
            const teamId = userTeamsMap.get(u.id);
            const team = teamId ? teamsMap.get(teamId) : null;

            return {
              id: u.id,
              name: `${u.first_name}${u.last_name ? ` ${u.last_name.charAt(0)}.` : ""}`,
              points: u.total_points,
              rank: idx + 1,
              teamLogo: team?.logo_url,
              teamName: team?.name,
            };
          });

          items.push({
            id: "general",
            type: "general",
            title: "Ranking",
            subtitle: "Geral",
            users: generalRanking.slice(0, 5),
          });
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
      } catch {
        setCarouselItems([
          {
            id: "general",
            type: "general",
            title: "Ranking",
            subtitle: "Geral",
            users: [],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  useEffect(() => {
    if (carouselItems.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [carouselItems.length, autoPlayInterval, isPaused]);

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

  return (
    <VerticalTile
      title={currentItem?.title || "Ranking"}
      subtitle={currentItem?.subtitle}
      colorTheme={isGeneralRanking ? "purple" : "blue"}
      delay={delay}
      onClick={handleNavigateToRanking}
    >
      <div
        className="flex flex-col h-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex items-center justify-between mb-2">
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
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-3 h-3 text-gray-400" />
              </button>
              <span className="text-[9px] text-gray-500 font-display">
                {currentIndex + 1}/{carouselItems.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
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
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
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
                    showTotalPoints={!isGeneralRanking}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {carouselItems.length > 1 && (
          <CarouselIndicator
            items={carouselItems}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />
        )}

        <div className="mt-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleNavigateToRanking}
            className={`
              w-full py-2 cursor-pointer
              ${
                isGeneralRanking
                  ? "bg-brm-purple/20 hover:bg-brm-purple/40 border-l-brm-purple text-brm-purple-foreground hover:text-white"
                  : "bg-brm-primary/20 hover:bg-brm-primary/40 border-l-brm-primary text-brm-primary hover:text-white"
              }
              border-l-4
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

export function RankingCardWithData({
  currentUserId,
  delay = 0,
}: {
  currentUserId?: string;
  delay?: number;
}) {
  return <RankingCard currentUserId={currentUserId} delay={delay} />;
}
