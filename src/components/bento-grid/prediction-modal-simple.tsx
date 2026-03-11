"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Minus, Plus, Loader2, Zap, Check } from "lucide-react";
import type { Match, MatchPrediction } from "./next-matches-card";

interface PredictionModalSimpleProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (matchId: string, homeScore: number, awayScore: number) => Promise<boolean>;
  initialPrediction?: MatchPrediction | null;
}

export function PredictionModalSimple({
  match,
  isOpen,
  onClose,
  onSubmit,
  initialPrediction,
}: PredictionModalSimpleProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialPrediction) {
      setHomeScore(initialPrediction.home_team_goals);
      setAwayScore(initialPrediction.away_team_goals);
    } else {
      setHomeScore(0);
      setAwayScore(0);
    }
  }, [initialPrediction, match?.id]);

  const handleSubmit = async () => {
    if (!match) return;
    setIsLoading(true);
    try {
      const success = await onSubmit(match.id, homeScore, awayScore);
      if (success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
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

  const matchDate = new Date(match.startTime);
  const formatMatchTime = () => {
    return matchDate.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }) + " • " + matchDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isEditing = !!initialPrediction;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-3 sm:inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50"
          >
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-brm-primary/20 via-brm-card to-brm-purple/20" />
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-brm-primary via-brm-secondary to-brm-accent" />
              
              <div className="relative bg-brm-card/95 border-l-4 border-brm-primary">
                <div className="relative px-4 sm:px-6 py-4 border-b border-white/10">
                  <div className="absolute inset-0 bg-linear-to-r from-brm-primary/10 to-transparent -skew-x-12 origin-top-left" />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 flex items-center justify-center -skew-x-6
                        ${isEditing ? "bg-brm-secondary/20" : "bg-brm-primary/20"}
                      `}>
                        <Zap className={`w-5 h-5 skew-x-6 ${isEditing ? "text-brm-secondary" : "text-brm-primary"}`} />
                      </div>
                      <div>
                        <h2 className="font-display font-black text-base sm:text-lg uppercase italic text-brm-text-primary">
                          {isEditing ? "Editar Palpite" : "Fazer Palpite"}
                        </h2>
                        <p className="font-display text-[10px] sm:text-xs text-brm-text-muted uppercase tracking-wider">
                          {match.tournamentName || "Campeonato"}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 -skew-x-6 transition-colors disabled:opacity-50"
                    >
                      <X size={18} className="text-brm-text-muted skew-x-6" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 bg-brm-background-dark/50 -skew-x-6 border-l-2 border-brm-secondary">
                      <span className="skew-x-6 font-display text-xs text-brm-text-secondary uppercase tracking-wide">
                        {formatMatchTime()}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-stretch justify-between gap-2 sm:gap-4">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                        <div className="absolute inset-0 bg-linear-to-br from-brm-primary/20 to-transparent -skew-x-3" />
                        <Image
                          src={match.homeTeam.logo}
                          alt={match.homeTeam.name}
                          fill
                          unoptimized
                          className="object-contain p-1 drop-shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/logo/waiting.svg";
                          }}
                        />
                      </div>
                      <span className="font-display font-bold text-xs sm:text-sm text-brm-text-primary uppercase tracking-wide text-center mb-3">
                        {match.homeTeam.shortName || match.homeTeam.name.split(" ")[0]}
                      </span>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => decrementScore("home")}
                          disabled={homeScore === 0 || isLoading}
                          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-brm-background-dark hover:bg-brm-primary/20 border border-white/10 hover:border-brm-primary/50 -skew-x-6 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus size={14} className="text-brm-text-primary skew-x-6" />
                        </motion.button>
                        
                        <div className="w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center bg-linear-to-br from-brm-primary/30 to-brm-primary/10 border-2 border-brm-primary -skew-x-6">
                          <span className="skew-x-6 font-display font-black text-3xl sm:text-4xl text-brm-primary drop-shadow-lg">
                            {homeScore}
                          </span>
                        </div>
                        
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => incrementScore("home")}
                          disabled={isLoading}
                          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-brm-background-dark hover:bg-brm-primary/20 border border-white/10 hover:border-brm-primary/50 -skew-x-6 transition-all disabled:opacity-30"
                        >
                          <Plus size={14} className="text-brm-text-primary skew-x-6" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center px-2">
                      <div className="w-px h-8 bg-linear-to-b from-transparent via-brm-text-muted/30 to-transparent" />
                      <span className="font-display font-black text-xl sm:text-2xl text-brm-text-muted/50 italic my-2">
                        VS
                      </span>
                      <div className="w-px h-8 bg-linear-to-b from-transparent via-brm-text-muted/30 to-transparent" />
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                        <div className="absolute inset-0 bg-linear-to-br from-brm-accent/20 to-transparent skew-x-3" />
                        <Image
                          src={match.awayTeam.logo}
                          alt={match.awayTeam.name}
                          fill
                          unoptimized
                          className="object-contain p-1 drop-shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/logo/waiting.svg";
                          }}
                        />
                      </div>
                      <span className="font-display font-bold text-xs sm:text-sm text-brm-text-primary uppercase tracking-wide text-center mb-3">
                        {match.awayTeam.shortName || match.awayTeam.name.split(" ")[0]}
                      </span>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => decrementScore("away")}
                          disabled={awayScore === 0 || isLoading}
                          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-brm-background-dark hover:bg-brm-accent/20 border border-white/10 hover:border-brm-accent/50 -skew-x-6 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus size={14} className="text-brm-text-primary skew-x-6" />
                        </motion.button>
                        
                        <div className="w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center bg-linear-to-br from-brm-accent/30 to-brm-accent/10 border-2 border-brm-accent -skew-x-6">
                          <span className="skew-x-6 font-display font-black text-3xl sm:text-4xl text-brm-accent drop-shadow-lg">
                            {awayScore}
                          </span>
                        </div>
                        
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => incrementScore("away")}
                          disabled={isLoading}
                          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-brm-background-dark hover:bg-brm-accent/20 border border-white/10 hover:border-brm-accent/50 -skew-x-6 transition-all disabled:opacity-30"
                        >
                          <Plus size={14} className="text-brm-text-primary skew-x-6" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 relative">
                    <div className="absolute inset-0 bg-brm-background-dark/80 -skew-x-3" />
                    <div className="relative p-3 sm:p-4 text-center">
                      <p className="font-display text-[10px] text-brm-text-muted uppercase tracking-widest mb-1">
                        Seu Palpite
                      </p>
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <span className="font-display font-bold text-sm sm:text-base text-brm-text-secondary uppercase">
                          {match.homeTeam.shortName || match.homeTeam.name.split(" ")[0]}
                        </span>
                        <div className="flex items-center gap-1 px-3 py-1 bg-brm-card border border-white/10 -skew-x-6">
                          <span className="skew-x-6 font-display font-black text-xl sm:text-2xl text-brm-primary">
                            {homeScore}
                          </span>
                          <span className="skew-x-6 font-display font-bold text-lg text-brm-text-muted mx-1">
                            ×
                          </span>
                          <span className="skew-x-6 font-display font-black text-xl sm:text-2xl text-brm-accent">
                            {awayScore}
                          </span>
                        </div>
                        <span className="font-display font-bold text-sm sm:text-base text-brm-text-secondary uppercase">
                          {match.awayTeam.shortName || match.awayTeam.name.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-3 mt-5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 -skew-x-6 transition-all disabled:opacity-50"
                    >
                      <span className="skew-x-6 font-display font-bold text-xs sm:text-sm uppercase tracking-wide text-brm-text-muted">
                        Cancelar
                      </span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className={`
                        flex-2 py-3 -skew-x-6 transition-all disabled:opacity-70
                        ${isEditing 
                          ? "bg-brm-secondary hover:bg-brm-secondary/90 text-brm-secondary-foreground" 
                          : "bg-brm-primary hover:bg-brm-primary/90 text-white"
                        }
                      `}
                    >
                      <span className="skew-x-6 font-display font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            {isEditing ? "Atualizar Palpite" : "Confirmar Palpite"}
                          </>
                        )}
                      </span>
                    </motion.button>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-brm-primary via-brm-secondary to-brm-accent opacity-50" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
