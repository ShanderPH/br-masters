"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Trophy, Medal, Crown, TrendingUp } from "lucide-react";
import { Button } from "@heroui/react";

import { Navbar } from "@/components/layout";
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
  favoriteTeamLogo: string;
}

interface RankingClientProps {
  user: RankingUser;
  generalRanking: RankingPlayer[];
  tournamentRankings: Record<string, RankingPlayer[]>;
}

const tournaments = [
  { id: "all", name: "Geral", icon: Trophy },
  { id: "325", name: "Brasileirão", logo: "/images/logo/brasileirao.svg" },
  { id: "373", name: "Copa do Brasil", logo: "/images/logo/cdb-betano.png" },
];

type TournamentFilter = "all" | "325" | "373";

export function RankingClient({
  user,
  generalRanking,
  tournamentRankings,
}: RankingClientProps) {
  const router = useRouter();
  const [selectedTournament, setSelectedTournament] = useState<TournamentFilter>("all");

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const currentRanking = selectedTournament === "all" 
    ? generalRanking 
    : tournamentRankings[selectedTournament] || [];

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-brm-text-muted">{position}º</span>;
    }
  };

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-500/10 border-amber-600/30";
      default:
        return "bg-brm-card border-white/5";
    }
  };

  // Get top 3 for podium (with fallbacks)
  const top3 = [
    currentRanking[0] || { id: "", name: "-", points: 0, predictions: 0, exactScores: 0, accuracy: 0, favoriteTeamLogo: "/images/logo/default-team.svg" },
    currentRanking[1] || { id: "", name: "-", points: 0, predictions: 0, exactScores: 0, accuracy: 0, favoriteTeamLogo: "/images/logo/default-team.svg" },
    currentRanking[2] || { id: "", name: "-", points: 0, predictions: 0, exactScores: 0, accuracy: 0, favoriteTeamLogo: "/images/logo/default-team.svg" },
  ];

  return (
    <div className="min-h-screen bg-brm-background">
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

      <main className="container mx-auto px-4 py-6 pt-20 md:pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-brm-text-primary flex items-center gap-3">
            <Trophy className="text-brm-secondary" />
            Ranking
          </h1>
          <p className="text-brm-text-muted mt-1">
            Confira a classificação dos melhores palpiteiros
          </p>
        </motion.div>

        {/* Tournament Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2"
        >
          {tournaments.map((tournament) => (
            <Button
              key={tournament.id}
              size="sm"
              variant={selectedTournament === tournament.id ? "primary" : "ghost"}
              onPress={() => setSelectedTournament(tournament.id as TournamentFilter)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {tournament.logo ? (
                <Image
                  src={tournament.logo}
                  alt={tournament.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              ) : tournament.icon ? (
                <tournament.icon size={16} />
              ) : null}
              {tournament.name}
            </Button>
          ))}
        </motion.div>

        {/* Top 3 Podium */}
        {currentRanking.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-2 sm:gap-4 mb-8"
          >
            {/* 2nd Place */}
            <div className="order-1 pt-8">
              <div className="geometric-card bg-linear-to-b from-gray-400/20 to-brm-card rounded-xl p-4 text-center border border-gray-400/30">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2">
                  <Image
                    src={top3[1].favoriteTeamLogo}
                    alt={top3[1].name}
                    fill
                    className="object-contain rounded-full"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    2º
                  </div>
                </div>
                <p className="font-bold text-brm-text-primary text-sm sm:text-base truncate">
                  {top3[1].name}
                </p>
                <p className="text-lg sm:text-xl font-bold text-gray-300">
                  {top3[1].points} pts
                </p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-2">
              <div className="geometric-card bg-linear-to-b from-yellow-500/30 to-brm-card rounded-xl p-4 text-center border border-yellow-500/30 relative">
                <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-400" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 mt-2">
                  <Image
                    src={top3[0].favoriteTeamLogo}
                    alt={top3[0].name}
                    fill
                    className="object-contain rounded-full"
                  />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    1º
                  </div>
                </div>
                <p className="font-bold text-brm-text-primary text-sm sm:text-base truncate">
                  {top3[0].name}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                  {top3[0].points} pts
                </p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 pt-12">
              <div className="geometric-card bg-linear-to-b from-amber-600/20 to-brm-card rounded-xl p-4 text-center border border-amber-600/30">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                  <Image
                    src={top3[2].favoriteTeamLogo}
                    alt={top3[2].name}
                    fill
                    className="object-contain rounded-full"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    3º
                  </div>
                </div>
                <p className="font-bold text-brm-text-primary text-xs sm:text-sm truncate">
                  {top3[2].name}
                </p>
                <p className="text-base sm:text-lg font-bold text-amber-500">
                  {top3[2].points} pts
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Ranking List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h2 className="text-lg font-semibold text-brm-text-primary mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-brm-primary" />
            Classificação Completa
          </h2>

          {currentRanking.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-brm-text-muted text-lg">
                Nenhum dado de ranking disponível ainda
              </p>
            </div>
          ) : (
            currentRanking.map((player, index) => (
              <motion.div
                key={player.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * Math.min(index, 10) }}
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border ${getPositionStyle(index + 1)} ${
                  user?.name === player.name ? "ring-2 ring-brm-primary" : ""
                }`}
              >
                {/* Position */}
                <div className="w-8 h-8 flex items-center justify-center">
                  {getPositionIcon(index + 1)}
                </div>

                {/* Avatar */}
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                  <Image
                    src={player.favoriteTeamLogo}
                    alt={player.name}
                    fill
                    className="object-contain rounded-full"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brm-text-primary truncate">
                    {player.name}
                    {user?.name === player.name && (
                      <span className="text-xs text-brm-primary ml-2">(você)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs text-brm-text-muted">
                    <span>{player.predictions} palpites</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{player.exactScores} placares exatos</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{player.accuracy}% acertos</span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="text-lg sm:text-xl font-bold text-brm-primary">
                    {player.points}
                  </p>
                  <p className="text-xs text-brm-text-muted">pts</p>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </main>
    </div>
  );
}
