"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Filter, Trophy } from "lucide-react";
import { Button } from "@heroui/react";

import { Navbar } from "@/components/layout";
import { MatchCard, PredictionModal } from "@/components/matches";
import { signOut } from "@/lib/auth/auth-service";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Match } from "@/lib/supabase/types";

interface PartidasUser {
  id: string;
  name: string;
  points: number;
  level: number;
  role: "user" | "admin";
}

interface PartidasClientProps {
  user: PartidasUser;
  matches: Match[];
  initialPredictions: Record<number, { homeScore: number; awayScore: number }>;
}

type FilterType = "all" | "pending" | "predicted";

export function PartidasClient({
  user,
  matches,
  initialPredictions,
}: PartidasClientProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [predictions, setPredictions] = useState(initialPredictions);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredMatches = matches.filter((match) => {
    if (filter === "pending") {
      return !predictions[match.id];
    }
    if (filter === "predicted") {
      return !!predictions[match.id];
    }
    return true;
  });

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const handlePredict = (match: Match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleSubmitPrediction = async (homeScore: number, awayScore: number) => {
    if (!selectedMatch) return;

    setIsSaving(true);

    try {
      // Determine winner
      type WinnerType = "home" | "away" | "draw";
      let winner: WinnerType = "draw";
      if (homeScore > awayScore) {
        winner = "home";
      } else if (awayScore > homeScore) {
        winner = "away";
      }

      // Check if prediction exists
      const existingPrediction = predictions[selectedMatch.id];

      if (existingPrediction) {
        // Update existing prediction
        await (supabase
          .from("predictions") as ReturnType<typeof supabase.from>)
          .update({
            home_team_goals: homeScore,
            away_team_goals: awayScore,
            winner,
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq("user_id", user.id)
          .eq("match_id", String(selectedMatch.id));
      } else {
        // Insert new prediction
        await (supabase.from("predictions") as ReturnType<typeof supabase.from>).insert({
          user_id: user.id,
          match_id: String(selectedMatch.id),
          home_team_goals: homeScore,
          away_team_goals: awayScore,
          winner,
        } as Record<string, unknown>);
      }

      // Update local state
      setPredictions((prev) => ({
        ...prev,
        [selectedMatch.id]: { homeScore, awayScore },
      }));

      setIsModalOpen(false);
      setSelectedMatch(null);
    } catch (error) {
      console.error("Error saving prediction:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const pendingCount = matches.filter((m) => !predictions[m.id]).length;
  const predictedCount = matches.filter((m) => !!predictions[m.id]).length;

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
            <Calendar className="text-brm-primary" />
            Partidas
          </h1>
          <p className="text-brm-text-muted mt-1">
            Faça seus palpites para as próximas partidas
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
        >
          <div className="bg-brm-card rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-brm-text-muted text-sm mb-1">
              <Trophy size={16} />
              Total de Partidas
            </div>
            <p className="text-2xl font-bold text-brm-text-primary">{matches.length}</p>
          </div>
          <div className="bg-brm-card rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-brm-primary text-sm mb-1">
              ✓ Palpites Feitos
            </div>
            <p className="text-2xl font-bold text-brm-primary">{predictedCount}</p>
          </div>
          <div className="bg-brm-card rounded-xl p-4 border border-white/5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-brm-accent text-sm mb-1">
              ⏳ Pendentes
            </div>
            <p className="text-2xl font-bold text-brm-accent">{pendingCount}</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2"
        >
          <Filter size={18} className="text-brm-text-muted shrink-0" />
          <Button
            size="sm"
            variant={filter === "all" ? "primary" : "ghost"}
            onPress={() => setFilter("all")}
          >
            Todas ({matches.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "pending" ? "primary" : "ghost"}
            onPress={() => setFilter("pending")}
          >
            Pendentes ({pendingCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "predicted" ? "primary" : "ghost"}
            onPress={() => setFilter("predicted")}
          >
            Palpitadas ({predictedCount})
          </Button>
        </motion.div>

        {/* Matches Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * Math.min(index, 10) }}
            >
              <MatchCard
                match={match}
                userPrediction={predictions[match.id]}
                onPredict={handlePredict}
                showPredictButton={true}
              />
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMatches.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-brm-text-muted text-lg">
              {filter === "pending"
                ? "🎉 Você já fez todos os palpites!"
                : filter === "predicted"
                  ? "Nenhum palpite feito ainda"
                  : "Nenhuma partida disponível no momento"}
            </p>
          </motion.div>
        )}
      </main>

      {/* Prediction Modal */}
      <PredictionModal
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMatch(null);
        }}
        onSubmit={handleSubmitPrediction}
        initialPrediction={selectedMatch ? predictions[selectedMatch.id] : null}
        isLoading={isSaving}
      />
    </div>
  );
}
