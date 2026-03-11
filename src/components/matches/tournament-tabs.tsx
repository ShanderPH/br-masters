"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import type { MatchTournament } from "./types";

interface TournamentTabsProps {
  tournaments: MatchTournament[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TournamentTabs({
  tournaments,
  selectedId,
  onSelect,
}: TournamentTabsProps) {
  if (tournaments.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex gap-1.5 sm:gap-2 min-w-max px-1 py-1">
        {tournaments.map((tournament, index) => {
          const isSelected = tournament.id === selectedId;

          return (
            <motion.button
              key={tournament.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(tournament.id)}
              className={`
                relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5
                font-display font-bold text-xs sm:text-sm uppercase tracking-wide
                transition-all duration-300 -skew-x-6
                border-b-2
                ${
                  isSelected
                    ? "bg-brm-primary/20 border-brm-primary text-brm-primary shadow-lg shadow-brm-primary/10"
                    : "bg-brm-card/60 border-transparent text-brm-text-muted hover:bg-brm-card hover:text-brm-text-secondary hover:border-brm-text-muted/30"
                }
              `}
            >
              <div className="skew-x-6 flex items-center gap-2">
                {tournament.logo_url && (
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0">
                    <Image
                      src={tournament.logo_url}
                      alt={tournament.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="whitespace-nowrap">{tournament.name}</span>
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    layoutId="tournament-tab-indicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-brm-primary/10 -z-10"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
