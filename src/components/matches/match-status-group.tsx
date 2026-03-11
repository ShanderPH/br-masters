"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle2, ChevronDown } from "lucide-react";
import { useState } from "react";

import { MatchCardEnhanced } from "./match-card-enhanced";
import type { MatchData, PredictionMap } from "./types";

interface MatchStatusGroupProps {
  status: "upcoming" | "finished";
  matches: MatchData[];
  predictions: PredictionMap;
  onPredict?: (match: MatchData) => void;
  defaultExpanded?: boolean;
}

export function MatchStatusGroup({
  status,
  matches,
  predictions,
  onPredict,
  defaultExpanded = true,
}: MatchStatusGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (matches.length === 0) return null;

  const isUpcoming = status === "upcoming";
  const icon = isUpcoming ? (
    <Clock className="w-3.5 h-3.5" />
  ) : (
    <CheckCircle2 className="w-3.5 h-3.5" />
  );
  const label = isUpcoming ? "Partidas Futuras" : "Partidas Finalizadas";
  const color = isUpcoming ? "text-brm-primary" : "text-brm-text-muted";
  const borderColor = isUpcoming ? "border-brm-primary/30" : "border-brm-text-muted/20";
  const bgColor = isUpcoming ? "bg-brm-primary/5" : "bg-white/[0.02]";

  return (
    <div className="mb-4 sm:mb-6">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center justify-between gap-2
          px-3 sm:px-4 py-2 sm:py-2.5
          ${bgColor} border-l-3 ${borderColor}
          transition-colors duration-200 hover:bg-brm-card/50
        `}
      >
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <span className={`font-display font-bold text-xs sm:text-sm uppercase tracking-wide ${color}`}>
            {label}
          </span>
          <span className="font-display text-[10px] text-brm-text-muted bg-white/5 px-1.5 py-0.5 rounded-sm">
            {matches.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-4 h-4 ${color}`} />
        </motion.div>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="overflow-hidden"
      >
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-2 sm:pt-3">
          {matches.map((match, index) => (
            <MatchCardEnhanced
              key={match.id}
              match={match}
              prediction={predictions[match.id]}
              onPredict={isUpcoming ? onPredict : undefined}
              index={index}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
