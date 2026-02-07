"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@heroui/react";

import type { Match } from "@/lib/supabase/types";

interface MatchCardProps {
  match: Match;
  userPrediction?: {
    homeScore: number;
    awayScore: number;
  } | null;
  onPredict?: (match: Match) => void;
  showPredictButton?: boolean;
}

export function MatchCard({
  match,
  userPrediction,
  onPredict,
  showPredictButton = true,
}: MatchCardProps) {
  const matchDate = new Date(match.start_time);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isPast = matchDate < new Date() || isFinished;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTeamLogo = (teamName: string, teamLogo: string | null) => {
    if (teamLogo) return teamLogo;
    const normalizedName = teamName.toLowerCase().replace(/\s+/g, "");
    return `/images/logo/${normalizedName}.svg`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="geometric-card bg-brm-card rounded-xl p-4 border border-white/5 glow-hover"
    >
      {/* Tournament Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-brm-text-muted">{match.tournament_name}</span>
        {isLive && (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            AO VIVO
          </span>
        )}
        {match.round_number && (
          <span className="text-xs text-brm-text-muted">Rodada {match.round_number}</span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14">
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
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center gap-1">
          {isFinished || isLive ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-brm-text-primary">
                {match.home_score ?? 0}
              </span>
              <span className="text-brm-text-muted">-</span>
              <span className="text-2xl font-bold text-brm-text-primary">
                {match.away_score ?? 0}
              </span>
            </div>
          ) : (
            <span className="text-lg font-semibold text-brm-text-muted">VS</span>
          )}

          {/* User Prediction */}
          {userPrediction && (
            <div className="flex items-center gap-1 px-2 py-1 bg-brm-primary/20 rounded-full">
              <span className="text-xs text-brm-primary font-medium">
                Seu palpite: {userPrediction.homeScore} - {userPrediction.awayScore}
              </span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14">
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
        </div>
      </div>

      {/* Date/Time & Action */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-brm-text-muted text-xs">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{formatDate(matchDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{formatTime(matchDate)}</span>
          </div>
        </div>

        {showPredictButton && !isPast && onPredict && (
          <Button
            size="sm"
            variant={userPrediction ? "ghost" : "primary"}
            onPress={() => onPredict(match)}
            className="font-semibold"
          >
            {userPrediction ? "Editar" : "Palpitar"}
          </Button>
        )}

        {isPast && userPrediction && (
          <span className="text-xs text-brm-text-muted">✓ Palpite registrado</span>
        )}
      </div>
    </motion.div>
  );
}
