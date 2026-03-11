"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, Loader2 } from "lucide-react";
import { WideTile } from "./bento-grid";
import { useTournamentContext } from "@/components/dashboard/tournament-context";
import { createClient } from "@/lib/supabase/client";
import { getTeamLogoPath } from "@/lib/services/team-logo-service";

interface RecentMatch {
  id: string;
  startTime: string;
  homeTeam: { name: string; code: string | null; logo: string };
  awayTeam: { name: string; code: string | null; logo: string };
  homeScore: number;
  awayScore: number;
  tournamentName: string;
}

function LatestMatchItem({ match, index }: { match: RecentMatch; index: number }) {
  const date = new Date(match.startTime);
  const formattedDate = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-2 py-1.5 px-2 bg-white/5 hover:bg-white/8 transition-colors -skew-x-3 shrink-0"
    >
      <div className="skew-x-3 flex items-center gap-2 w-full">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="relative w-5 h-5 shrink-0">
            <Image
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          <span className="font-display font-bold text-[9px] text-brm-text-secondary truncate">
            {match.homeTeam.code || match.homeTeam.name.split(" ")[0]}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="font-display font-black text-xs text-brm-text-primary">
            {match.homeScore}
          </span>
          <span className="text-[8px] text-brm-text-muted font-bold">×</span>
          <span className="font-display font-black text-xs text-brm-text-primary">
            {match.awayScore}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="font-display font-bold text-[9px] text-brm-text-secondary truncate text-right">
            {match.awayTeam.code || match.awayTeam.name.split(" ")[0]}
          </span>
          <div className="relative w-5 h-5 shrink-0">
            <Image
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        </div>

        <span className="font-display text-[8px] text-brm-text-muted shrink-0 ml-1 tabular-nums">
          {formattedDate}
        </span>
      </div>
    </motion.div>
  );
}

export function LatestMatchesCard({ delay = 0 }: { delay?: number }) {
  const { currentTournament } = useTournamentContext();
  const [matches, setMatches] = useState<RecentMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from("recent_results")
          .select("id, start_time, home_score, away_score, tournament_id, tournament_name, home_team_name, home_team_code, home_team_logo, away_team_name, away_team_code, away_team_logo")
          .order("start_time", { ascending: false })
          .limit(5);

        if (currentTournament?.id) {
          query = query.eq("tournament_id", currentTournament.id);
        }

        const { data } = await query;

        type Row = {
          id: string;
          start_time: string;
          home_score: number;
          away_score: number;
          tournament_id: string;
          tournament_name: string;
          home_team_name: string;
          home_team_code: string | null;
          home_team_logo: string | null;
          away_team_name: string;
          away_team_code: string | null;
          away_team_logo: string | null;
        };

        const rows = (data as Row[] | null) || [];
        setMatches(
          rows.map((r) => ({
            id: r.id,
            startTime: r.start_time,
            homeTeam: {
              name: r.home_team_name,
              code: r.home_team_code,
              logo: r.home_team_logo || getTeamLogoPath(r.home_team_name),
            },
            awayTeam: {
              name: r.away_team_name,
              code: r.away_team_code,
              logo: r.away_team_logo || getTeamLogoPath(r.away_team_name),
            },
            homeScore: r.home_score,
            awayScore: r.away_score,
            tournamentName: r.tournament_name,
          }))
        );
      } catch {
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatest();
  }, [currentTournament?.id]);

  if (isLoading) {
    return (
      <WideTile colorTheme="blue" delay={delay}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-5 h-5 animate-spin text-brm-primary" />
        </div>
      </WideTile>
    );
  }

  return (
    <WideTile colorTheme="blue" delay={delay}>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-1.5 shrink-0">
          <div className="w-5 h-5 flex items-center justify-center bg-cyan-500/20 -skew-x-6">
            <CheckCircle2 className="w-3 h-3 text-cyan-400 skew-x-6" />
          </div>
          <h3 className="font-display text-[10px] sm:text-xs text-cyan-400 font-black uppercase italic tracking-wide">
            Últimas Partidas
          </h3>
        </div>

        <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar min-h-0">
          {matches.length === 0 ? (
            <p className="text-[10px] text-brm-text-muted font-display text-center py-3">
              Nenhum resultado recente
            </p>
          ) : (
            matches.map((match, i) => (
              <LatestMatchItem key={match.id} match={match} index={i} />
            ))
          )}
        </div>
      </div>
    </WideTile>
  );
}
