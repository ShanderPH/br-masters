"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Gamepad2, Users, TrendingUp, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

interface PrizePoolData {
  category: string;
  totalApproved: number;
  totalPending: number;
  participants: number;
}

const CATEGORY_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}> = {
  tournament_prize: {
    label: "Torneio",
    icon: <Trophy className="w-5 h-5" />,
    color: "#CCFF00",
    gradient: "from-[#CCFF00]/20 to-transparent",
  },
  round_prize: {
    label: "Rodada",
    icon: <Target className="w-5 h-5" />,
    color: "#25B8B8",
    gradient: "from-[#25B8B8]/20 to-transparent",
  },
  match_prize: {
    label: "Partida",
    icon: <Gamepad2 className="w-5 h-5" />,
    color: "#D63384",
    gradient: "from-[#D63384]/20 to-transparent",
  },
};

export function PrizePoolVisualization() {
  const router = useRouter();
  const [pools, setPools] = useState<PrizePoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchPools() {
      const { data, error } = await supabase
        .from("prize_pools")
        .select("category, total_approved, total_pending, participants_count, status")
        .eq("status", "active");

      if (!cancelled && !error && data && data.length > 0) {
        type PoolRow = {
          category: string;
          total_approved: number;
          total_pending: number;
          participants_count: number;
        };
        setPools(
          (data as PoolRow[]).map((row) => ({
            category: row.category || "tournament_prize",
            totalApproved: Number(row.total_approved),
            totalPending: Number(row.total_pending),
            participants: row.participants_count,
          }))
        );
      }
      if (!cancelled) setIsLoading(false);
    }

    fetchPools();
    return () => { cancelled = true; };
  }, []);

  const hasAnyPool = pools.some((p) => p.totalApproved > 0 || p.totalPending > 0);

  if (isLoading || !hasAnyPool) return null;

  return (
    <div className="col-span-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
          <h3 className="font-display font-black text-xs text-white uppercase tracking-wider">
            Premiações Ativas
          </h3>
        </div>
        <button
          onClick={() => router.push("/checkout")}
          className="text-[10px] font-display font-bold uppercase text-[#25B8B8] hover:text-[#25B8B8]/80 transition-colors flex items-center gap-1"
        >
          Depositar <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <AnimatePresence>
          {pools
            .filter((p) => p.totalApproved > 0 || p.totalPending > 0)
            .map((pool, index) => {
              const config = CATEGORY_CONFIG[pool.category] || CATEGORY_CONFIG.tournament_prize;
              return (
                <motion.div
                  key={pool.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative overflow-hidden bg-white/3 border border-white/6 p-4"
                >
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${config.gradient} pointer-events-none`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}15`, color: config.color }}
                      >
                        {config.icon}
                      </div>
                      <span
                        className="font-display font-black text-[10px] uppercase tracking-wider"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-white/40 text-xs">R$</span>
                        <span
                          className="font-display font-black text-2xl"
                          style={{ color: config.color }}
                        >
                          {pool.totalApproved.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {pool.totalPending > 0 && (
                        <p className="text-[10px] text-white/30">
                          + R$ {pool.totalPending.toFixed(2)} pendente
                        </p>
                      )}

                      <div className="flex items-center gap-1 pt-1">
                        <Users className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] text-white/30">
                          {pool.participants} participante{pool.participants !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
}
