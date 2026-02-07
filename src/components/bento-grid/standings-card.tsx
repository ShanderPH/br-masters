"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { StandardTile } from "./bento-grid";

interface StandingsCardProps {
  delay?: number;
}

export function StandingsCard({ delay = 0 }: StandingsCardProps) {
  const router = useRouter();

  return (
    <StandardTile
      colorTheme="purple"
      delay={delay}
      onClick={() => router.push("/ranking")}
      className="col-span-1 min-h-[140px] sm:min-h-[160px] md:min-h-[180px]"
    >
      <div className="h-full flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.3 }}
        >
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-brm-purple-foreground" />
        </motion.div>
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: delay + 0.2, duration: 0.3 }}
          className="font-display font-bold text-xs sm:text-sm md:text-base uppercase italic text-brm-text-primary dark:text-white"
        >
          Classificação
        </motion.h3>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.3 }}
          className="font-display text-[9px] sm:text-[10px] text-brm-text-muted dark:text-gray-400 mt-1 uppercase"
        >
          Ver Tabelas
        </motion.p>
      </div>
    </StandardTile>
  );
}
