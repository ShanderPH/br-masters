"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react";

import type { KPIStats } from "./types";

interface KPIStatsBarProps {
  stats: KPIStats;
  isLoading?: boolean;
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  borderColor: string;
  delay: number;
}

function KPICard({ icon, label, value, color, bgColor, borderColor, delay }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        relative overflow-hidden
        p-3 sm:p-4
        bg-brm-card/80 backdrop-blur-sm
        border-l-3 ${borderColor}
        -skew-x-3
        group hover:bg-brm-card transition-colors duration-300
      `}
    >
      <div className="skew-x-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className={`w-5 h-5 flex items-center justify-center ${bgColor} -skew-x-3`}>
            <span className="skew-x-3">{icon}</span>
          </div>
          <span className="font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider font-bold">
            {label}
          </span>
        </div>
        <p className={`font-display font-black text-xl sm:text-2xl italic ${color} leading-none`}>
          {value}
        </p>
      </div>

      <div className="absolute top-0 right-0 w-12 h-12 opacity-5 group-hover:opacity-10 transition-opacity">
        <div className={`w-full h-full ${bgColor} -skew-x-12 translate-x-4 -translate-y-2`} />
      </div>
    </motion.div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="p-3 sm:p-4 bg-brm-card/80 -skew-x-3 animate-pulse">
      <div className="skew-x-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 bg-white/10 rounded" />
          <div className="h-2.5 w-16 bg-white/10 rounded" />
        </div>
        <div className="h-7 w-12 bg-white/10 rounded mt-1" />
      </div>
    </div>
  );
}

export function KPIStatsBar({ stats, isLoading = false }: KPIStatsBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const kpis: Omit<KPICardProps, "delay">[] = [
    {
      icon: <Trophy className="w-3 h-3 text-yellow-400" />,
      label: "Partidas",
      value: stats.totalMatches,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-l-yellow-500",
    },
    {
      icon: <Clock className="w-3 h-3 text-brm-accent" />,
      label: "Restantes",
      value: stats.remainingMatches,
      color: "text-brm-accent",
      bgColor: "bg-brm-accent/20",
      borderColor: "border-l-brm-accent",
    },
    {
      icon: <CheckCircle2 className="w-3 h-3 text-brm-secondary" />,
      label: "Palpites",
      value: stats.predictionsMade,
      color: "text-brm-secondary",
      bgColor: "bg-brm-secondary/20",
      borderColor: "border-l-brm-secondary",
    },
    {
      icon: <TrendingUp className="w-3 h-3 text-brm-primary" />,
      label: "Pontos",
      value: stats.roundPoints,
      color: "text-brm-primary",
      bgColor: "bg-brm-primary/20",
      borderColor: "border-l-brm-primary",
    },
    {
      icon: <Target className="w-3 h-3 text-orange-400" />,
      label: "Acerto",
      value: `${stats.accuracyRate}%`,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-l-orange-500",
    },
    {
      icon: <Award className="w-3 h-3 text-purple-400" />,
      label: "Ranking",
      value: stats.currentRank > 0 ? `#${stats.currentRank}` : "-",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-l-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.label} {...kpi} delay={index * 0.05} />
      ))}
    </div>
  );
}
