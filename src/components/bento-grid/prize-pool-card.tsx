"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@heroui/react";
import { WideTile } from "./bento-grid";
import { createClient } from "@/lib/supabase/client";

interface PrizePoolCardProps {
  prizePool?: {
    total: number;
    participants: number;
  } | null;
  formatCurrency?: (amount: number) => string;
  onClick?: () => void;
  delay?: number;
  isLoading?: boolean;
}

export function PrizePoolCard({
  prizePool,
  formatCurrency,
  onClick,
  delay = 0,
  isLoading = false,
}: PrizePoolCardProps) {
  const format =
    formatCurrency ||
    ((n: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n));

  const hasPool = prizePool && prizePool.total > 0;

  if (isLoading) {
    return (
      <WideTile colorTheme="lime" delay={delay}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-brm-secondary" />
        </div>
      </WideTile>
    );
  }

  return (
    <WideTile colorTheme="lime" delay={delay} onClick={onClick}>
      <div className="flex items-center justify-between h-full">
        <div className="max-w-[65%]">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-brm-secondary" />
            <span className="font-display text-xs text-brm-secondary font-bold uppercase tracking-wider">
              Prêmio Atual
            </span>
          </div>
          <motion.h3
            key={prizePool?.total}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="font-display font-black text-2xl md:text-3xl uppercase italic text-brm-text-primary dark:text-white"
          >
            {hasPool ? format(prizePool.total) : "Em breve"}
          </motion.h3>
          {hasPool && prizePool.participants > 0 ? (
            <p className="text-brm-text-secondary dark:text-gray-400 text-xs mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              {prizePool.participants} participantes
            </p>
          ) : (
            <p className="text-brm-text-muted dark:text-gray-500 text-xs mt-1">Nova temporada iniciando</p>
          )}
        </div>

        <Button
          variant="primary"
          className="px-4 py-2 md:px-5 md:py-2.5 bg-brm-secondary text-brm-background-dark font-display font-bold uppercase text-sm rounded-sm transition-all duration-500 hover:bg-white hover:shadow-lg hover:shadow-brm-secondary/30"
          onPress={onClick}
        >
          Participar
        </Button>
      </div>
    </WideTile>
  );
}

export function PrizePoolCardWithData({
  delay = 0,
  onClick,
}: {
  delay?: number;
  onClick?: () => void;
}) {
  const [prizePool, setPrizePool] = useState<{ total: number; participants: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrizePool = async () => {
      try {
        const supabase = createClient();

        const { data } = await supabase
          .from("prize_pools")
          .select("total_approved, participants_count")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        type PrizePoolRow = {
          total_approved: number;
          participants_count: number;
        };

        const pool = data as PrizePoolRow | null;

        if (pool) {
          setPrizePool({
            total: pool.total_approved,
            participants: pool.participants_count,
          });
        }
      } catch {
        // Keep null state
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrizePool();
  }, []);

  return (
    <PrizePoolCard prizePool={prizePool} onClick={onClick} delay={delay} isLoading={isLoading} />
  );
}
