"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@heroui/react";

import type { Match } from "@/lib/supabase/types";

interface PredictionModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (homeScore: number, awayScore: number) => Promise<void>;
  initialPrediction?: {
    homeScore: number;
    awayScore: number;
  } | null;
  isLoading?: boolean;
}

export function PredictionModal({
  match,
  isOpen,
  onClose,
  onSubmit,
  initialPrediction,
  isLoading = false,
}: PredictionModalProps) {
  const [homeScore, setHomeScore] = useState(initialPrediction?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(initialPrediction?.awayScore ?? 0);

  const getTeamLogo = (teamName: string, teamLogo: string | null) => {
    if (teamLogo) return teamLogo;
    const normalizedName = teamName.toLowerCase().replace(/\s+/g, "");
    return `/images/logo/${normalizedName}.svg`;
  };

  const handleSubmit = async () => {
    await onSubmit(homeScore, awayScore);
  };

  const incrementScore = (team: "home" | "away") => {
    if (team === "home") {
      setHomeScore((prev) => Math.min(prev + 1, 15));
    } else {
      setAwayScore((prev) => Math.min(prev + 1, 15));
    }
  };

  const decrementScore = (team: "home" | "away") => {
    if (team === "home") {
      setHomeScore((prev) => Math.max(prev - 1, 0));
    } else {
      setAwayScore((prev) => Math.max(prev - 1, 0));
    }
  };

  if (!match) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
          >
            <div className="bg-brm-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="relative px-6 py-4 bg-gradient-to-r from-brm-primary/20 to-brm-purple/20 border-b border-white/5">
                <h2 className="text-lg font-bold text-brm-text-primary text-center">
                  Fazer Palpite
                </h2>
                <p className="text-xs text-brm-text-muted text-center mt-1">
                  {match.tournament_name}
                </p>
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-brm-text-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Teams */}
                <div className="flex items-center justify-between gap-4">
                  {/* Home Team */}
                  <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="relative w-16 h-16">
                      <Image
                        src={getTeamLogo(match.home_team_name, match.home_team_logo)}
                        alt={match.home_team_name}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/logo/waiting.svg";
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-brm-text-primary text-center">
                      {match.home_team_short_name}
                    </span>

                    {/* Score Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrementScore("home")}
                        disabled={homeScore === 0}
                        className="p-2 rounded-full bg-brm-card-elevated hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus size={16} className="text-brm-text-primary" />
                      </button>
                      <span className="w-12 text-center text-3xl font-bold text-brm-primary">
                        {homeScore}
                      </span>
                      <button
                        onClick={() => incrementScore("home")}
                        className="p-2 rounded-full bg-brm-card-elevated hover:bg-white/10 transition-colors"
                      >
                        <Plus size={16} className="text-brm-text-primary" />
                      </button>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-brm-text-muted">X</span>
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="relative w-16 h-16">
                      <Image
                        src={getTeamLogo(match.away_team_name, match.away_team_logo)}
                        alt={match.away_team_name}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/logo/waiting.svg";
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-brm-text-primary text-center">
                      {match.away_team_short_name}
                    </span>

                    {/* Score Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrementScore("away")}
                        disabled={awayScore === 0}
                        className="p-2 rounded-full bg-brm-card-elevated hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus size={16} className="text-brm-text-primary" />
                      </button>
                      <span className="w-12 text-center text-3xl font-bold text-brm-accent">
                        {awayScore}
                      </span>
                      <button
                        onClick={() => incrementScore("away")}
                        className="p-2 rounded-full bg-brm-card-elevated hover:bg-white/10 transition-colors"
                      >
                        <Plus size={16} className="text-brm-text-primary" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 bg-brm-background rounded-xl text-center">
                  <p className="text-sm text-brm-text-muted mb-1">Seu palpite</p>
                  <p className="text-2xl font-bold text-brm-text-primary">
                    {match.home_team_short_name}{" "}
                    <span className="text-brm-primary">{homeScore}</span>
                    {" x "}
                    <span className="text-brm-accent">{awayScore}</span>{" "}
                    {match.away_team_short_name}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="ghost"
                    onPress={onClose}
                    className="flex-1"
                    isDisabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onPress={handleSubmit}
                    className="flex-1 font-semibold"
                    isDisabled={isLoading}
                  >
                    {isLoading ? "Salvando..." : "Confirmar Palpite"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
