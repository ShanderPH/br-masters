"use client";

import { useState, useCallback } from "react";
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
  UserStatsCardWithData,
  StandingsCard,
  LatestMatchesCard,
  BestOfRoundCard,
  LatestPredictionsCard,
  PredictionModalSimple,
  FullBleedTile,
} from "@/components/bento-grid";
import type { Match, MatchPrediction } from "@/components/bento-grid";
import { signOut } from "@/lib/auth/auth-service";
import { createClient } from "@/lib/supabase/client";

interface DashboardUser {
  id: string;
  supabaseId: string;
  name: string;
  points: number;
  level: number;
  xp: number;
  avatarUrl?: string | null;
  role: "user" | "admin";
}

interface DashboardClientProps {
  user: DashboardUser;
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
  approvedPrizeTotal: number;
  unreadNotifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
  }>;
}

export function DashboardClient({
  user,
  prizePool,
  approvedPrizeTotal,
  unreadNotifications,
}: DashboardClientProps) {
  const router = useRouter();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<MatchPrediction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const handleDeposit = () => {
    router.push("/checkout");
  };

  const handleMatchClick = useCallback((match: Match, prediction?: MatchPrediction) => {
    setSelectedMatch(match);
    setSelectedPrediction(prediction || null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMatch(null);
    setSelectedPrediction(null);
  }, []);

  const handleSubmitPrediction = useCallback(async (matchId: string, homeScore: number, awayScore: number): Promise<boolean> => {
    try {
      const supabase = createClient();
      
      const winner = homeScore > awayScore ? "home" : homeScore < awayScore ? "away" : "draw";
      
      const { data: existingPrediction } = await supabase
        .from("predictions")
        .select("id")
        .eq("user_id", user.supabaseId)
        .eq("match_id", matchId)
        .maybeSingle();

      if (existingPrediction) {
        const { error } = await supabase
          .from("predictions")
          .update({
            home_team_goals: homeScore,
            away_team_goals: awayScore,
            winner,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", (existingPrediction as { id: string }).id);

        if (error) {
          console.error("Error updating prediction:", error);
          return false;
        }
      } else {
        const { error } = await supabase
          .from("predictions")
          .insert({
            user_id: user.supabaseId,
            match_id: matchId,
            home_team_goals: homeScore,
            away_team_goals: awayScore,
            winner,
          } as never);

        if (error) {
          console.error("Error creating prediction:", error);
          return false;
        }
      }

      setRefreshKey((prev) => prev + 1);
      return true;
    } catch (error) {
      console.error("Error submitting prediction:", error);
      return false;
    }
  }, [user.supabaseId]);

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
              xp: user.xp,
              avatarUrl: user.avatarUrl,
              role: user.role,
            }}
            approvedPrizeTotal={approvedPrizeTotal}
            unreadNotifications={unreadNotifications}
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
                  key={`matches-${refreshKey}`}
                  delay={0.1}
                  currentUserId={user.supabaseId}
                  onMatchClick={handleMatchClick}
                />

                <RankingCardWithData currentUserId={user.supabaseId} delay={0.15} />

                <LatestPredictionsCard delay={0.2} />

                <PrizePoolCard
                  prizePool={prizePool}
                  onClick={handleDeposit}
                  delay={0.25}
                />

                <FullBleedTile colorTheme="blue" delay={0.3}>
                  <UserStatsCardWithData currentUserId={user.supabaseId} />
                </FullBleedTile>

                <StandingsCard delay={0.35} />

                <LatestMatchesCard delay={0.4} />

                <FullBleedTile colorTheme="gold" delay={0.45}>
                  <BestOfRoundCard />
                </FullBleedTile>
              </BentoGrid>
            </motion.section>
          </main>
        </div>
      </div>
      <PredictionModalSimple
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPrediction}
        initialPrediction={selectedPrediction}
      />
    </TournamentProvider>
  );
}
