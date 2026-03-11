"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RoundSelectorProps {
  rounds: Array<{ number: number | null; name: string | null }>;
  selectedRound: number | null;
  onSelect: (round: number | null) => void;
  showAll?: boolean;
}

export function RoundSelector({
  rounds,
  selectedRound,
  onSelect,
  showAll = true,
}: RoundSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && selectedRound !== null) {
      const activeBtn = scrollRef.current.querySelector(
        `[data-round="${selectedRound}"]`
      );
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedRound]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -200 : 200;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (rounds.length === 0) return null;

  const getRoundLabel = (round: { number: number | null; name: string | null }) => {
    if (round.name) return round.name;
    if (round.number) return `Rodada ${round.number}`;
    return "Geral";
  };

  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={() => scroll("left")}
        className="shrink-0 p-1 sm:p-1.5 bg-brm-card/80 hover:bg-brm-card text-brm-text-muted hover:text-brm-text-primary rounded transition-colors"
        aria-label="Rolar para esquerda"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1"
      >
        {showAll && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onSelect(null)}
            className={`
              shrink-0 px-3 py-1.5 font-display font-bold text-[10px] sm:text-xs uppercase tracking-wide
              transition-all duration-200 rounded-sm
              ${
                selectedRound === null
                  ? "bg-brm-primary text-white shadow-md shadow-brm-primary/20"
                  : "bg-brm-card/60 text-brm-text-muted hover:bg-brm-card hover:text-brm-text-secondary"
              }
            `}
          >
            Todas
          </motion.button>
        )}

        {rounds.map((round, index) => {
          const isSelected = round.number === selectedRound;

          return (
            <motion.button
              key={round.number ?? `phase-${index}`}
              data-round={round.number}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => onSelect(round.number)}
              className={`
                shrink-0 px-3 py-1.5 font-display font-bold text-[10px] sm:text-xs uppercase tracking-wide
                transition-all duration-200 rounded-sm whitespace-nowrap
                ${
                  isSelected
                    ? "bg-brm-secondary text-brm-background-dark shadow-md shadow-brm-secondary/20"
                    : "bg-brm-card/60 text-brm-text-muted hover:bg-brm-card hover:text-brm-text-secondary"
                }
              `}
            >
              {getRoundLabel(round)}
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={() => scroll("right")}
        className="shrink-0 p-1 sm:p-1.5 bg-brm-card/80 hover:bg-brm-card text-brm-text-muted hover:text-brm-text-primary rounded transition-colors"
        aria-label="Rolar para direita"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
