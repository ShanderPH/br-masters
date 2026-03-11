"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Edit3,
  Target,
  Star,
} from "lucide-react";

import { getTeamLogoPath } from "@/lib/services/team-logo-service";
import type { MatchData, PredictionMap } from "./types";

interface MatchCardEnhancedProps {
  match: MatchData;
  prediction?: PredictionMap[string];
  onPredict?: (match: MatchData) => void;
  index?: number;
}

function getTeamLogo(name: string, logoUrl: string | null): string {
  if (logoUrl) return logoUrl;
  return getTeamLogoPath(name);
}

function getPointsBadge(prediction: PredictionMap[string] | undefined) {
  if (!prediction?.pointsEarned) return null;

  if (prediction.isExactScore) {
    return {
      label: "Na Mosca!",
      points: prediction.pointsEarned,
      color: "text-brm-secondary",
      bg: "bg-brm-secondary/20",
      border: "border-brm-secondary/40",
      icon: <Star className="w-3 h-3" />,
    };
  }

  if (prediction.isCorrectResult) {
    return {
      label: "Acertou",
      points: prediction.pointsEarned,
      color: "text-brm-primary",
      bg: "bg-brm-primary/20",
      border: "border-brm-primary/40",
      icon: <Target className="w-3 h-3" />,
    };
  }

  return {
    label: "Errou",
    points: 0,
    color: "text-brm-text-muted",
    bg: "bg-white/5",
    border: "border-white/10",
    icon: null,
  };
}

export function MatchCardEnhanced({
  match,
  prediction,
  onPredict,
  index = 0,
}: MatchCardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false);

  const matchDate = new Date(match.start_time);
  const now = new Date();
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const hasStarted = now >= matchDate || isLive || isFinished;
  const canPredict = !hasStarted;
  const hasPrediction = !!prediction;

  const hoursUntilMatch = Math.max(
    0,
    (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  );
  const isUrgent = hoursUntilMatch <= 24 && hoursUntilMatch > 0;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isToday = matchDate.toDateString() === today.toDateString();
  const isTomorrow = matchDate.toDateString() === tomorrow.toDateString();

  const formatDate = () => {
    if (isToday) return "Hoje";
    if (isTomorrow) return "Amanhã";
    return matchDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatTime = () => {
    return matchDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pointsBadge = isFinished ? getPointsBadge(prediction) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.04, duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={canPredict && onPredict ? () => onPredict(match) : undefined}
      className={`
        relative overflow-hidden
        bg-brm-card/80 backdrop-blur-sm
        border-l-4 transition-all duration-300
        group
        ${canPredict && onPredict ? "cursor-pointer" : ""}
        ${isFinished ? "border-l-brm-text-muted/30" : ""}
        ${isLive ? "border-l-red-500" : ""}
        ${canPredict && hasPrediction ? "border-l-brm-secondary" : ""}
        ${canPredict && !hasPrediction ? "border-l-brm-primary" : ""}
        ${isHovered && canPredict ? "bg-brm-card shadow-lg shadow-brm-primary/5" : ""}
      `}
    >
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-white/2 pointer-events-none" />

      {isUrgent && !hasStarted && (
        <div className="absolute top-0 right-0">
          <div className="bg-orange-500/90 text-white text-[8px] font-display font-bold uppercase px-2 py-0.5 -skew-x-12">
            <span className="skew-x-12 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              {hoursUntilMatch < 1
                ? `${Math.ceil(hoursUntilMatch * 60)}min`
                : `${Math.floor(hoursUntilMatch)}h`}
            </span>
          </div>
        </div>
      )}

      {isLive && (
        <div className="absolute top-0 right-0">
          <div className="bg-red-500/90 text-white text-[8px] font-display font-bold uppercase px-2 py-0.5 -skew-x-12 animate-pulse">
            <span className="skew-x-12 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              AO VIVO
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-[52px] sm:min-w-[60px]">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                <Image
                  src={getTeamLogo(match.home_team_name, match.home_team_logo)}
                  alt={match.home_team_name}
                  fill
                  unoptimized
                  className="object-contain drop-shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/logo/waiting.svg";
                  }}
                />
              </div>
              <span className="font-display font-bold text-[9px] sm:text-[10px] text-brm-text-secondary text-center truncate max-w-[52px] sm:max-w-[60px]">
                {match.home_team_code || match.home_team_name.split(" ")[0]}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1 flex-1">
              {isFinished || isLive ? (
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-2xl sm:text-3xl text-brm-text-primary italic">
                    {match.home_score ?? 0}
                  </span>
                  <span className="font-display text-sm text-brm-text-muted font-bold">×</span>
                  <span className="font-display font-black text-2xl sm:text-3xl text-brm-text-primary italic">
                    {match.away_score ?? 0}
                  </span>
                </div>
              ) : hasPrediction ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-brm-secondary/15 border border-brm-secondary/25 -skew-x-6">
                  <div className="skew-x-6 flex items-center gap-2">
                    <span className="font-display font-black text-lg sm:text-xl text-brm-secondary">
                      {prediction.homeScore}
                    </span>
                    <span className="text-xs text-brm-text-muted font-bold">×</span>
                    <span className="font-display font-black text-lg sm:text-xl text-brm-secondary">
                      {prediction.awayScore}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="font-display font-black text-lg sm:text-xl text-brm-text-muted/50 italic">
                  VS
                </span>
              )}

              {isFinished && hasPrediction && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="text-[9px] text-brm-text-muted font-display">
                    Palpite: {prediction.homeScore} × {prediction.awayScore}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1 min-w-[52px] sm:min-w-[60px]">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                <Image
                  src={getTeamLogo(match.away_team_name, match.away_team_logo)}
                  alt={match.away_team_name}
                  fill
                  unoptimized
                  className="object-contain drop-shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/logo/waiting.svg";
                  }}
                />
              </div>
              <span className="font-display font-bold text-[9px] sm:text-[10px] text-brm-text-secondary text-center truncate max-w-[52px] sm:max-w-[60px]">
                {match.away_team_code || match.away_team_name.split(" ")[0]}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0 min-w-[64px]">
            <span
              className={`
                font-display font-bold text-[10px] sm:text-xs uppercase tracking-wide
                ${isToday ? "text-brm-secondary" : isTomorrow ? "text-yellow-400" : isFinished ? "text-brm-text-muted/60" : "text-brm-text-muted"}
              `}
            >
              {isFinished ? "Encerrado" : formatDate()}
            </span>
            <span className="font-display font-bold text-sm sm:text-base text-brm-text-primary">
              {formatTime()}
            </span>

            {!isFinished && !isLive && (
              <>
                {hasPrediction ? (
                  <div className="flex items-center gap-1 text-brm-secondary">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[9px] font-display font-bold uppercase">Feito</span>
                  </div>
                ) : canPredict ? (
                  <div className="flex items-center gap-1 text-brm-text-muted">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-display font-bold uppercase">Pendente</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[9px] font-display font-bold uppercase">Fechado</span>
                  </div>
                )}
              </>
            )}

            {pointsBadge && (
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 ${pointsBadge.bg} border ${pointsBadge.border} rounded-sm`}
              >
                {pointsBadge.icon}
                <span className={`text-[9px] font-display font-bold ${pointsBadge.color}`}>
                  +{pointsBadge.points}
                </span>
              </div>
            )}
          </div>
        </div>

        {canPredict && onPredict && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: isHovered || !hasPrediction ? 1 : 0.7,
              height: "auto",
            }}
            className="mt-2.5 pt-2.5 border-t border-white/5"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onPredict(match);
              }}
              className={`
                w-full py-2 sm:py-2.5 -skew-x-6
                font-display font-bold text-[10px] sm:text-xs uppercase tracking-wide
                flex items-center justify-center gap-1.5
                transition-all duration-300 shadow-md
                ${
                  hasPrediction
                    ? "bg-brm-secondary/15 hover:bg-brm-secondary/25 text-brm-secondary border border-brm-secondary/30 shadow-brm-secondary/10"
                    : "bg-brm-primary hover:bg-brm-primary/80 text-white shadow-brm-primary/20"
                }
              `}
            >
              <span className="skew-x-6 flex items-center gap-1.5">
                {hasPrediction ? (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar Palpite
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Fazer Palpite
                  </>
                )}
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>

      <div className="absolute top-0 -left-full w-1/2 h-full bg-linear-to-r from-transparent via-white/4 to-transparent -skew-x-20 group-hover:left-[150%] transition-all duration-700 pointer-events-none" />
    </motion.div>
  );
}
