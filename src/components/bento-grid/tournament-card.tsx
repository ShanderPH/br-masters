"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronRight, ChevronLeft, Calendar, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FeatureTile } from "./bento-grid";
import { useTournamentContext } from "@/components/dashboard/tournament-context";
import { getTeamLogoPath } from "@/lib/services/team-logo-service";

interface StandingTeam {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    logo: string;
  };
  points: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  scoresFor: number;
  scoresAgainst: number;
  goalDifference: number;
}

const StandingsTable = ({ standings, maxTeams = 6 }: { standings: StandingTeam[]; maxTeams?: number }) => {
  if (!standings || standings.length === 0) return null;

  const displayStandings = standings.slice(0, maxTeams);

  return (
    <div className="mt-2 space-y-0.5 flex-1 min-h-0">
      <div className="flex items-center gap-2 mb-1.5">
        <Trophy className="w-3 h-3 text-yellow-400" />
        <span className="font-display text-[10px] text-brm-text-secondary dark:text-gray-400 uppercase tracking-wider">
          Classificação
        </span>
        <span className="font-display text-[8px] text-brm-text-muted dark:text-gray-500 ml-auto">
          Top {maxTeams}
        </span>
      </div>
      <div className="overflow-y-auto custom-scrollbar space-y-0.5">
        {displayStandings.map((standing, idx) => (
          <motion.div
            key={standing.team.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`
              flex items-center gap-1.5 py-0.5 sm:py-1 px-2 -skew-x-3
              transition-colors duration-200
              ${standing.position === 1 ? "bg-yellow-500/20 border-l-2 border-yellow-500" : ""}
              ${standing.position >= 2 && standing.position <= 4 ? "bg-green-500/10 border-l-2 border-green-500/50" : ""}
              ${standing.position >= 5 && standing.position <= 6 ? "bg-blue-500/10 border-l-2 border-blue-500/50" : ""}
              ${standing.position > 6 ? "bg-white/5 dark:bg-slate-800/50 border-l-2 border-transparent" : ""}
              hover:bg-white/10 dark:hover:bg-slate-700/50
            `}
          >
            <div className="skew-x-3 flex items-center gap-1.5 w-full">
              <span
                className={`
                  font-display font-black text-[10px] w-4 text-center tabular-nums
                  ${standing.position === 1 ? "text-yellow-400" : ""}
                  ${standing.position >= 2 && standing.position <= 4 ? "text-green-400" : ""}
                  ${standing.position >= 5 && standing.position <= 6 ? "text-blue-400" : ""}
                  ${standing.position > 6 ? "text-brm-text-muted dark:text-gray-500" : ""}
                `}
              >
                {standing.position}
              </span>
              <div className="relative w-4 h-4 shrink-0">
                <Image
                  src={standing.team.logo || getTeamLogoPath(standing.team.name)}
                  alt={standing.team.name}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <span className="font-display text-[9px] md:text-[10px] text-brm-text-primary dark:text-white truncate flex-1">
                {standing.team.shortName || standing.team.name}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-[8px] text-brm-text-muted dark:text-gray-500 tabular-nums hidden sm:block">
                  {standing.matches}J
                </span>
                <span className="font-display font-bold text-[10px] text-brm-text-primary dark:text-white tabular-nums min-w-[20px] text-right">
                  {standing.points}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export function TournamentCardWithData({ delay = 0 }: { delay?: number }) {
  const router = useRouter();
  const {
    tournaments,
    currentTournament,
    currentSeason,
    currentRound,
    isLoading,
    currentIndex,
    goToNext,
    goToPrev,
  } = useTournamentContext();

  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);

  const isLeague = currentTournament?.format === "league";

  useEffect(() => {
    const fetchStandings = async () => {
      if (!currentTournament || !isLeague) {
        setStandings([]);
        setLoadingStandings(false);
        return;
      }
      setLoadingStandings(true);
      try {
        const sofascoreTournamentId = currentTournament.sofascore_id;
        const sofascoreSeasonId = currentSeason?.sofascore_season_id;

        if (!sofascoreTournamentId) {
          setStandings([]);
          setLoadingStandings(false);
          return;
        }

        const params = new URLSearchParams({ tournamentId: String(sofascoreTournamentId) });
        if (sofascoreSeasonId) params.set("seasonId", String(sofascoreSeasonId));

        const response = await fetch(
          `/api/sofascore/standings?${params.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setStandings(Array.isArray(data.standings) ? data.standings : []);
        } else {
          setStandings([]);
        }
      } catch {
        setStandings([]);
      } finally {
        setLoadingStandings(false);
      }
    };

    fetchStandings();
  }, [currentTournament, currentSeason, isLeague]);

  if (isLoading) {
    return (
      <FeatureTile colorTheme="pink" delay={delay}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-brm-accent" />
        </div>
      </FeatureTile>
    );
  }

  if (!tournaments.length || !currentTournament) {
    return (
      <FeatureTile
        title="Campeonatos"
        subtitle="Nenhum campeonato ativo"
        colorTheme="pink"
        delay={delay}
      >
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Trophy className="w-12 h-12 mb-2 opacity-30" />
          <p className="text-xs text-brm-text-muted">Aguardando campeonatos</p>
        </div>
      </FeatureTile>
    );
  }

  return (
    <FeatureTile
      colorTheme="pink"
      delay={delay}
      bgImage={undefined}
      onClick={() => {
        const params = new URLSearchParams();
        if (currentTournament?.id) params.set("torneio", currentTournament.id);
        if (currentRound > 0) params.set("rodada", String(currentRound));
        router.push(`/partidas?${params.toString()}`);
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 rounded-lg p-1 shrink-0 backdrop-blur-md shadow-lg">
              <Image
                src={currentTournament.logo_url || "/images/brasileirao-logo.svg"}
                alt={currentTournament.name}
                fill
                className="object-contain p-0.5"
              />
            </div>

            <div className="min-w-0">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={currentTournament.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-display font-black text-base sm:text-lg md:text-xl uppercase italic leading-tight text-brm-text-primary dark:text-white drop-shadow-lg truncate"
                >
                  {currentTournament.name}
                </motion.h2>
              </AnimatePresence>
              <div className="flex items-center gap-2 mt-0.5">
                {currentRound > 0 && (
                  <span className="text-[10px] text-brm-text-muted font-display flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Rodada {currentRound}
                  </span>
                )}
              </div>
            </div>
          </div>

          {tournaments.length > 1 && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              <span className="text-[10px] text-gray-500 font-display tabular-nums">
                {currentIndex + 1}/{tournaments.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>


        {!isLeague ? (
          <div className="flex flex-col items-center justify-center flex-1 py-4 gap-2">
            <Trophy className="w-8 h-8 text-brm-accent/40" />
            <span className="font-display text-[10px] uppercase tracking-wider text-brm-text-muted dark:text-gray-500 text-center">
              {currentTournament?.format === "knockout" ? "Mata-Mata" : "Fase de Grupos + Mata-Mata"}
            </span>
          </div>
        ) : loadingStandings ? (
          <div className="flex items-center justify-center py-4 flex-1">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <StandingsTable standings={standings} />
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            const params = new URLSearchParams();
            if (currentTournament?.id) params.set("torneio", currentTournament.id);
            if (currentRound > 0) params.set("rodada", String(currentRound));
            router.push(`/partidas?${params.toString()}`);
          }}
          className="w-full mt-2 shrink-0 bg-brm-accent text-white font-display font-bold uppercase px-4 py-2 text-xs sm:text-sm -skew-x-12 transition-colors duration-300 hover:bg-brm-secondary hover:text-brm-background-dark shadow-lg hover:shadow-brm-secondary/30 flex items-center justify-center gap-2"
        >
          <span className="skew-x-12 flex items-center gap-2 font-display">
            Ver Partidas
            <ChevronRight className="w-4 h-4" />
          </span>
        </motion.button>
      </div>
    </FeatureTile>
  );
}
