"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { DashboardBackground, TournamentProvider } from "@/components/dashboard";
import {
  BentoGrid,
  TournamentCardWithData,
  NextMatchesCardWithData,
  RankingCardWithData,
  PrizePoolCard,
  UserStatsCard,
  StandingsCard,
} from "@/components/bento-grid";
import type { Match } from "@/components/bento-grid";
import { signOut } from "@/lib/auth/auth-service";

interface DashboardUser {
  id: string;
  name: string;
  points: number;
  level: number;
  role: "user" | "admin";
}

interface DashboardStats {
  totalPredictions: number;
  correctPredictions: number;
  exactScores: number;
  accuracy: number;
}

interface DashboardClientProps {
  user: DashboardUser;
  stats: DashboardStats;
  ranking: Array<{
    id: string;
    name: string;
    points: number;
    position: number;
    teamLogo?: string | null;
  }>;
  matches: Array<{
    id: string;
    homeTeam: { name: string; shortName: string; logo?: string };
    awayTeam: { name: string; shortName: string; logo?: string };
    startTime: string;
    status: "scheduled" | "live" | "finished";
    hasPrediction: boolean;
  }>;
  prizePool: {
    total: number;
    participants: number;
  };
}

export function DashboardClient({
  user,
  stats,
  prizePool,
}: DashboardClientProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const handleDeposit = () => {
    router.push("/partidas");
  };

  const handleMatchClick = (match: Match) => {
    router.push(`/partidas?match=${match.id}`);
  };

  const userStats = {
    predictions: stats.totalPredictions,
    accuracy: stats.accuracy,
    points: user.points,
    exactScores: stats.exactScores,
    correctResults: stats.correctPredictions,
  };

  return (
    <TournamentProvider>
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

          <main className="flex-1 flex flex-col pt-16 md:pt-20">
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full flex-1 px-2 sm:px-4 md:px-6 py-3 sm:py-5 md:py-8"
            >
              <BentoGrid>
                <TournamentCardWithData delay={0} />

                <NextMatchesCardWithData
                  delay={0.1}
                  currentUserId={user.id}
                  onMatchClick={handleMatchClick}
                />

                <RankingCardWithData currentUserId={user.id} delay={0.15} />

                <PrizePoolCard
                  prizePool={prizePool}
                  onClick={handleDeposit}
                  delay={0.2}
                />

                <UserStatsCard stats={userStats} delay={0.25} />

                <StandingsCard delay={0.3} />
              </BentoGrid>
            </motion.section>
          </main>
        </div>
      </div>
    </TournamentProvider>
  );
}
