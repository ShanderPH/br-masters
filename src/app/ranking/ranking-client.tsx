"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
} from "lucide-react";

import { Navbar } from "@/components/layout";
import { DashboardBackground } from "@/components/dashboard";
import { signOut } from "@/lib/auth/auth-service";

interface RankingUser {
  id: string;
  name: string;
  points: number;
  level: number;
  role: "user" | "admin";
}

interface RankingPlayer {
  id: string;
  name: string;
  points: number;
  predictions: number;
  exactScores: number;
  accuracy: number;
  favoriteTeamLogo: string | null;
  currentRank?: number | null;
  previousRank?: number | null;
}

interface TournamentTab {
  id: string;
  name: string;
  logo: string;
}

interface RankingClientProps {
  user: RankingUser;
  generalRanking: RankingPlayer[];
  tournamentRankings: Record<string, RankingPlayer[]>;
  tournaments?: TournamentTab[];
}

const RankChangeIndicator = ({ current, previous }: { current: number; previous?: number | null }) => {
  if (!previous || previous === current) {
    return <Minus className="w-3 h-3 text-gray-500" />;
  }
  const diff = previous - current;
  if (diff > 0) {
    return (
      <div className="flex items-center gap-0.5">
        <TrendingUp className="w-3 h-3 text-green-400" />
        <span className="text-[10px] font-bold text-green-400 tabular-nums">+{diff}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      <TrendingDown className="w-3 h-3 text-red-400" />
      <span className="text-[10px] font-bold text-red-400 tabular-nums">{diff}</span>
    </div>
  );
};

const PositionBadge = ({ position }: { position: number }) => {
  if (position === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (position === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (position === 3) return <Award className="w-5 h-5 text-amber-500" />;
  return (
    <span className="font-display font-black text-sm text-gray-500 tabular-nums">
      {position}º
    </span>
  );
};

const defaultLogo = "/images/brm-icon.svg";

export function RankingClient({
  user,
  generalRanking,
  tournamentRankings,
  tournaments = [],
}: RankingClientProps) {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("all");

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const currentRanking: RankingPlayer[] =
    selectedFilter === "all"
      ? generalRanking
      : tournamentRankings[selectedFilter] || [];

  const isTournamentView = selectedFilter !== "all";

  const top3 = currentRanking.slice(0, 3);

  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = ["h-24 sm:h-28", "h-32 sm:h-36", "h-20 sm:h-24"];
  const podiumColors = [
    "from-gray-400/30 to-gray-500/10 border-gray-400/40",
    "from-yellow-500/30 to-yellow-600/10 border-yellow-500/40",
    "from-amber-600/30 to-amber-700/10 border-amber-600/40",
  ];
  const podiumTextColors = ["text-gray-300", "text-yellow-400", "text-amber-500"];
  const podiumBadgeColors = ["bg-gray-400", "bg-yellow-500", "bg-amber-600"];
  const podiumPositions = [2, 1, 3];

  return (
    <div className="min-h-screen relative">
      <DashboardBackground />

      <div className="relative z-10">
        <Navbar
          isAuthenticated={true}
          user={{
            id: user.id,
            name: user.name,
            points: user.points,
            level: user.level,
            role: user.role,
          }}
          onLogout={handleLogout}
        />

        <main className="container mx-auto px-3 sm:px-4 md:px-6 pt-20 md:pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-5"
          >
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors -skew-x-6"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-brm-text-primary skew-x-6" />
            </button>
            <div>
              <h1 className="font-display font-black text-xl sm:text-2xl uppercase italic text-brm-text-primary flex items-center gap-2">
                <Trophy className="w-6 h-6 text-brm-secondary" />
                Ranking
              </h1>
              <p className="font-display text-xs text-brm-text-muted uppercase tracking-wider">
                Classificação dos melhores palpiteiros
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1"
          >
            <button
              onClick={() => setSelectedFilter("all")}
              className={`
                flex items-center gap-2 px-4 py-2 -skew-x-6 whitespace-nowrap
                font-display font-bold text-xs uppercase tracking-wide
                transition-all duration-200 shrink-0
                ${
                  selectedFilter === "all"
                    ? "bg-brm-purple/30 text-brm-purple-foreground border border-brm-purple/50"
                    : "bg-white/5 text-brm-text-muted border border-white/10 hover:bg-white/10"
                }
              `}
            >
              <Trophy className="w-4 h-4 skew-x-6" />
              <span className="skew-x-6">Geral</span>
            </button>

            {tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedFilter(t.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 -skew-x-6 whitespace-nowrap
                  font-display font-bold text-xs uppercase tracking-wide
                  transition-all duration-200 shrink-0
                  ${
                    selectedFilter === t.id
                      ? "bg-brm-primary/30 text-brm-primary border border-brm-primary/50"
                      : "bg-white/5 text-brm-text-muted border border-white/10 hover:bg-white/10"
                  }
                `}
              >
                <div className="relative w-4 h-4 skew-x-6">
                  <Image src={t.logo} alt={t.name} fill className="object-contain" />
                </div>
                <span className="skew-x-6">{t.name}</span>
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {top3.length >= 3 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 items-end">
                  {podiumOrder.map((player, idx) => {
                    if (!player) return <div key={idx} />;
                    const pos = podiumPositions[idx];
                    return (
                      <motion.div
                        key={player.id || idx}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + idx * 0.1 }}
                        className={`${idx === 1 ? "order-2" : idx === 0 ? "order-1" : "order-3"}`}
                      >
                        <div
                          className={`
                            relative flex flex-col items-center justify-end
                            bg-linear-to-b ${podiumColors[idx]}
                            border -skew-x-3 p-3 sm:p-4
                            ${podiumHeights[idx]}
                          `}
                        >
                          <div className="skew-x-3 flex flex-col items-center">
                            {pos === 1 && (
                              <Crown className="w-6 h-6 text-yellow-400 mb-1 absolute -top-3" />
                            )}
                            <div className="relative w-10 h-10 sm:w-14 sm:h-14 mb-1">
                              <Image
                                src={player.favoriteTeamLogo || defaultLogo}
                                alt={player.name}
                                fill
                                className="object-contain"
                              />
                              <div
                                className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 ${podiumBadgeColors[idx]} rounded-full flex items-center justify-center text-[10px] font-black text-white`}
                              >
                                {pos}º
                              </div>
                            </div>
                            <p className="font-display font-bold text-[10px] sm:text-xs text-brm-text-primary uppercase truncate max-w-full text-center">
                              {player.name}
                            </p>
                            <p className={`font-display font-black text-sm sm:text-lg italic ${podiumTextColors[idx]}`}>
                              {player.points}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-0.5 flex-1 bg-linear-to-r from-brm-primary/50 to-transparent" />
                  <span className="font-display text-[10px] text-brm-text-muted uppercase tracking-widest">
                    Classificação Completa
                  </span>
                  <div className="h-0.5 flex-1 bg-linear-to-l from-brm-primary/50 to-transparent" />
                </div>

                {currentRanking.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Trophy className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-display text-sm text-brm-text-muted">
                      Nenhum dado de ranking disponível
                    </p>
                  </div>
                ) : (
                  currentRanking.map((player, index) => {
                    const position = index + 1;
                    const isCurrentUser = user.id === player.id;
                    const isTop3 = position <= 3;

                    return (
                      <motion.div
                        key={player.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * Math.min(index, 15) }}
                        className={`
                          flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3
                          -skew-x-3 transition-all duration-200
                          ${isCurrentUser ? "bg-brm-secondary/15 border-l-2 border-l-brm-secondary" : ""}
                          ${!isCurrentUser && isTop3 ? "border-l-2" : ""}
                          ${!isCurrentUser && position === 1 ? "bg-yellow-500/10 border-l-yellow-400" : ""}
                          ${!isCurrentUser && position === 2 ? "bg-gray-400/10 border-l-gray-300" : ""}
                          ${!isCurrentUser && position === 3 ? "bg-amber-600/10 border-l-amber-600" : ""}
                          ${!isCurrentUser && !isTop3 ? "bg-white/2 hover:bg-white/5" : ""}
                        `}
                      >
                        <div className="skew-x-3 flex items-center gap-2 sm:gap-3 w-full">
                          <div className="w-7 h-7 flex items-center justify-center shrink-0">
                            <PositionBadge position={position} />
                          </div>

                          <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                            <Image
                              src={player.favoriteTeamLogo || defaultLogo}
                              alt={player.name}
                              fill
                              className="object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`font-display font-bold text-xs sm:text-sm uppercase truncate ${isCurrentUser ? "text-brm-secondary" : "text-brm-text-primary"}`}>
                              {player.name}
                              {isCurrentUser && (
                                <span className="text-[10px] text-brm-primary ml-1.5 normal-case">(você)</span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-brm-text-muted font-display">
                              <span>{player.predictions} palpites</span>
                              <span className="hidden sm:inline text-gray-600">•</span>
                              <span className="hidden sm:inline">{player.exactScores} exatos</span>
                              <span className="hidden sm:inline text-gray-600">•</span>
                              <span className="hidden sm:inline">{player.accuracy}%</span>
                            </div>
                          </div>

                          {isTournamentView && player.currentRank != null && (
                            <div className="shrink-0">
                              <RankChangeIndicator
                                current={player.currentRank}
                                previous={player.previousRank}
                              />
                            </div>
                          )}

                          <div className="text-right shrink-0">
                            <p className={`font-display font-black text-base sm:text-lg italic tabular-nums ${isCurrentUser ? "text-brm-secondary" : position === 1 ? "text-yellow-400" : "text-brm-primary"}`}>
                              {player.points}
                            </p>
                            <p className="font-display text-[9px] text-brm-text-muted uppercase">pts</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
