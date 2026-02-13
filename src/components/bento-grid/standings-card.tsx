"use client";

import { motion } from "framer-motion";
import { BarChart3, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { StandardTile } from "./bento-grid";

interface StandingsCardProps {
  delay?: number;
}

export function StandingsCard({ delay = 0 }: StandingsCardProps) {
  const router = useRouter();

  return (
    <StandardTile
      colorTheme="gold"
      delay={delay}
      onClick={() => router.push("/classificacao")}
    >
      <div className="h-full flex flex-col items-center justify-center text-center relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.3 }}
          className="relative"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-yellow-500/15 -skew-x-6 mb-2">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400 skew-x-6" />
          </div>
        </motion.div>
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: delay + 0.2, duration: 0.3 }}
          className="font-display font-black text-xs sm:text-sm uppercase italic text-brm-text-primary dark:text-white"
        >
          Classificação
        </motion.h3>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.3 }}
          className="flex items-center gap-1 mt-1 text-yellow-400/80"
        >
          <span className="font-display text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">
            Ver Tabela
          </span>
          <ChevronRight className="w-3 h-3" />
        </motion.div>
      </div>
    </StandardTile>
  );
}
