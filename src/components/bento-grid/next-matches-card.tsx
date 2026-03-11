"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Loader2,
  CalendarDays,
  Clock,
  Zap,
  Edit3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { VerticalTile } from "./bento-grid";
import { createClient } from "@/lib/supabase/client";
import { useTournamentContext } from "@/components/dashboard/tournament-context";
import { getTeamLogoPath } from "@/lib/services/team-logo-service";

export interface Match {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    shortName?: string;
    logo: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName?: string;
    logo: string;
  };
  startTime: string;
  status: string;
  tournamentName?: string;
  roundNumber?: number;
}

export interface MatchPrediction {
  home_team_goals: number;
  away_team_goals: number;
}

interface NextMatchesCardProps {
  matches?: Match[];
  isLoading?: boolean;
  delay?: number;
  onMatchClick?: (match: Match, prediction?: MatchPrediction) => void;
  userPredictions?: Record<string, MatchPrediction>;
  currentUserId?: string;
  roundNumber?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalMatches?: number;
}

const UrgencyBadge = ({ hoursUntilMatch, isToday }: { hoursUntilMatch: number; isToday: boolean }) => {
  if (!isToday || hoursUntilMatch <= 0) return null;

  const isVeryUrgent = hoursUntilMatch <= 2;
  const isUrgent = hoursUntilMatch <= 6;

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: -10 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 200,
          damping: 15,
          duration: 0.6,
        },
      }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.3 },
      }}
      className={`
        absolute top-1 right-1 z-20 px-1.5 sm:px-2 py-0.5 rounded-sm
        font-display font-bold text-[8px] sm:text-[9px] uppercase tracking-wider
        flex items-center gap-0.5 sm:gap-1 whitespace-nowrap
        shadow-lg
        ${
          isVeryUrgent
            ? "bg-red-500 text-white animate-pulse shadow-red-500/50"
            : isUrgent
              ? "bg-orange-500 text-white shadow-orange-500/50"
              : "bg-yellow-500 text-yellow-900 shadow-yellow-500/50"
        }
      `}
    >
      {isVeryUrgent ? (
        <>
          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="hidden xs:inline">Fechando!</span>
          <span className="xs:hidden">!</span>
        </>
      ) : isUrgent ? (
        <>
          <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="hidden sm:inline">Últimas horas</span>
          <span className="sm:hidden">Urgente</span>
        </>
      ) : (
        <>
          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Hoje
        </>
      )}
    </motion.div>
  );
};

const MatchItem = ({
  match,
  onClick,
  index,
  prediction,
}: {
  match: Match;
  onClick?: () => void;
  index: number;
  prediction?: MatchPrediction;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const matchDate = new Date(match.startTime);
  const now = new Date();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = matchDate.toDateString() === today.toDateString();
  const isTomorrow = matchDate.toDateString() === tomorrow.toDateString();
  const hasPrediction = !!prediction;

  const hoursUntilMatch = Math.max(
    0,
    (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  );

  const hasStarted = now >= matchDate;
  const canPredict = !hasStarted;

  const formatDate = () => {
    if (isToday) return "Hoje";
    if (isTomorrow) return "Amanhã";
    return matchDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatTime = () => {
    return matchDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 300 }}
      onClick={canPredict ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative flex flex-col
        p-2.5 sm:p-3 md:p-4
        bg-linear-to-r from-brm-card/80 dark:from-slate-800/80 to-brm-card-elevated/80 dark:to-slate-900/80
        hover:from-brm-primary/20 hover:to-brm-card/80 dark:hover:to-slate-800/80
        border border-brm-text-muted/20 dark:border-slate-700/50 hover:border-brm-primary/50
        rounded-lg
        transition-all duration-300
        ${canPredict ? "cursor-pointer" : "cursor-default opacity-70"}
        group
        ${hasPrediction ? "border-l-4 border-l-brm-secondary" : ""}
      `}
    >
      {isToday && !hasStarted && <UrgencyBadge hoursUntilMatch={hoursUntilMatch} isToday={isToday} />}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px]">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14">
              <Image
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                fill
                unoptimized
                className="object-contain drop-shadow-lg"
              />
            </div>
            <span className="font-display font-bold text-[9px] sm:text-[10px] text-brm-text-secondary dark:text-gray-300 text-center truncate max-w-[50px] sm:max-w-[60px]">
              {match.homeTeam.shortName || match.homeTeam.name.split(" ")[0]}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            {hasPrediction ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-brm-secondary/20 rounded-md border border-brm-secondary/30">
                <span className="font-display font-black text-lg sm:text-xl text-brm-secondary">
                  {prediction.home_team_goals}
                </span>
                <span className="text-sm text-gray-500 font-bold">×</span>
                <span className="font-display font-black text-lg sm:text-xl text-brm-secondary">
                  {prediction.away_team_goals}
                </span>
              </div>
            ) : (
              <span className="font-display font-black text-lg sm:text-xl text-brm-text-muted dark:text-gray-600">
                VS
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px]">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14">
              <Image
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                fill
                unoptimized
                className="object-contain drop-shadow-lg"
              />
            </div>
            <span className="font-display font-bold text-[9px] sm:text-[10px] text-brm-text-secondary dark:text-gray-300 text-center truncate max-w-[50px] sm:max-w-[60px]">
              {match.awayTeam.shortName || match.awayTeam.name.split(" ")[0]}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`
              font-display font-bold text-[10px] sm:text-xs uppercase tracking-wide
              ${isToday ? "text-brm-secondary" : isTomorrow ? "text-yellow-400" : "text-gray-400"}
            `}
          >
            {formatDate()}
          </span>
          <span className="font-display font-bold text-sm sm:text-base text-brm-text-primary dark:text-white">
            {formatTime()}
          </span>

          {hasPrediction ? (
            <div className="flex items-center gap-1 text-brm-secondary">
              <CheckCircle2 className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase">Palpite feito</span>
            </div>
          ) : canPredict ? (
            <div className="flex items-center gap-1 text-brm-text-muted dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase">Aguardando</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase">Fechado</span>
            </div>
          )}
        </div>
      </div>

      {canPredict && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: 10 }}
          animate={{
            opacity: isHovered || !hasPrediction ? 1 : 0.8,
            height: "auto",
            y: 0,
            transition: {
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94],
            },
          }}
          className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-700/50"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full py-2 sm:py-2.5 -skew-x-6
              font-display font-bold text-[10px] sm:text-xs uppercase tracking-wide
              flex items-center justify-center gap-1.5 sm:gap-2
              transition-all duration-300
              ${
                hasPrediction
                  ? "bg-brm-secondary/20 hover:bg-brm-secondary/30 text-brm-secondary border-l-2 border-brm-secondary"
                  : "bg-brm-primary hover:bg-brm-primary/90 text-white border-l-2 border-brm-secondary"
              }
            `}
          >
            <span className="skew-x-6 flex items-center gap-1.5">
              {hasPrediction ? (
                <>
                  <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Editar Palpite
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Fazer Palpite
                </>
              )}
            </span>
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export function NextMatchesCard({
  matches = [],
  isLoading = false,
  delay = 0,
  onMatchClick,
  userPredictions = {},
  roundNumber,
  hasMore = false,
  onLoadMore,
  totalMatches: totalMatchCount,
}: NextMatchesCardProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const predictedMatches = matches.filter((m) => userPredictions[m.id]).length;

  const now = new Date();
  const todayMatches = matches.filter((m) => {
    const matchDate = new Date(m.startTime);
    return matchDate.toDateString() === now.toDateString();
  }).length;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || !onLoadMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        onLoadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, onLoadMore]);

  if (isLoading) {
    return (
      <VerticalTile colorTheme="teal" delay={delay}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-brm-primary" />
        </div>
      </VerticalTile>
    );
  }

  if (matches.length === 0) {
    return (
      <VerticalTile title="Próximas" subtitle="Partidas" colorTheme="teal" delay={delay}>
        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
          <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm text-center font-display">Nenhuma partida agendada</p>
          <p className="text-xs text-center text-gray-500 mt-1">Aguarde novas rodadas</p>
        </div>
      </VerticalTile>
    );
  }

  return (
    <VerticalTile
      title="Próximas"
      subtitle={roundNumber ? `Rodada ${roundNumber}` : "Partidas"}
      colorTheme="teal"
      delay={delay}
    >
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-brm-secondary" />
              <span className="text-[10px] text-gray-400">
                <span className="font-bold text-brm-secondary">{predictedMatches}</span>/
                {totalMatchCount || matches.length}
              </span>
            </div>
            {todayMatches > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/20 rounded-full">
                <Zap className="w-2.5 h-2.5 text-orange-400" />
                <span className="text-[9px] text-orange-400 font-bold">
                  {todayMatches} hoje
                </span>
              </div>
            )}
          </div>

          {hasMore && (
            <span className="text-[9px] text-gray-500">
              Role para mais
            </span>
          )}
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex-1 flex flex-col gap-1.5 sm:gap-2 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth"
        >
          <AnimatePresence mode="popLayout">
            {matches.map((match, index) => (
              <MatchItem
                key={match.id}
                match={match}
                index={index}
                prediction={userPredictions[match.id]}
                onClick={() => {
                  if (onMatchClick) {
                    onMatchClick(match, userPredictions[match.id]);
                  } else {
                    router.push(`/partidas?match=${match.id}`);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-700/50 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/partidas")}
            className="w-full py-2 cursor-pointer bg-brm-purple/20 hover:bg-brm-purple/40 border border-brm-purple/30 hover:border-brm-purple/50 text-brm-text-primary hover:text-white text-[10px] sm:text-xs font-display font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 -skew-x-6"
          >
            <span className="skew-x-6 flex items-center gap-1.5">
              Ver Todas
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </motion.button>
        </div>
      </div>
    </VerticalTile>
  );
}

export function NextMatchesCardWithData({
  delay = 0,
  currentUserId,
  onMatchClick,
}: {
  delay?: number;
  currentUserId?: string;
  onMatchClick?: (match: Match, prediction?: MatchPrediction) => void;
}) {
  const { currentTournament, computedRound } = useTournamentContext();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPredictions, setUserPredictions] = useState<Record<string, MatchPrediction>>({});
  const [visibleCount, setVisibleCount] = useState(4);
  const INITIAL_MATCHES = 4;
  const LOAD_MORE_COUNT = 4;

  useEffect(() => {
    setVisibleCount(INITIAL_MATCHES);
  }, [currentTournament?.id, computedRound]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const tournamentId = currentTournament?.id;

        let query = supabase
          .from("upcoming_matches")
          .select("id, slug, start_time, status, round_number, home_team_id, home_team_name, home_team_code, home_team_logo, away_team_id, away_team_name, away_team_code, away_team_logo, tournament_id, tournament_name")
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(50);

        if (tournamentId) {
          query = query.eq("tournament_id", tournamentId);
          if (computedRound > 0) {
            query = query.eq("round_number", computedRound);
          }
        }

        const { data: matchesData } = await query;

        type MatchRow = {
          id: string;
          slug: string;
          start_time: string;
          status: string;
          round_number: number | null;
          home_team_id: string;
          home_team_name: string;
          home_team_code: string | null;
          home_team_logo: string | null;
          away_team_id: string;
          away_team_name: string;
          away_team_code: string | null;
          away_team_logo: string | null;
          tournament_id: string;
          tournament_name: string;
        };

        const dbMatches = (matchesData as MatchRow[] | null) || [];

        const formatted: Match[] = dbMatches.map((m) => ({
          id: m.id,
          homeTeam: {
            id: m.home_team_id,
            name: m.home_team_name,
            shortName: m.home_team_code || undefined,
            logo: m.home_team_logo || getTeamLogoPath(m.home_team_name),
          },
          awayTeam: {
            id: m.away_team_id,
            name: m.away_team_name,
            shortName: m.away_team_code || undefined,
            logo: m.away_team_logo || getTeamLogoPath(m.away_team_name),
          },
          startTime: m.start_time,
          status: m.status,
          roundNumber: m.round_number || undefined,
          tournamentName: m.tournament_name,
        }));

        const predictionsMap: Record<string, MatchPrediction> = {};

        if (currentUserId && formatted.length > 0) {
          const matchIds = formatted.map((m) => m.id);
          const { data: predictionsData } = await supabase
            .from("predictions")
            .select("match_id, home_team_goals, away_team_goals")
            .eq("user_id", currentUserId)
            .in("match_id", matchIds);

          type PredictionRow = {
            match_id: string;
            home_team_goals: number;
            away_team_goals: number;
          };

          const predictions = (predictionsData as PredictionRow[] | null) || [];
          predictions.forEach((p) => {
            predictionsMap[String(p.match_id)] = {
              home_team_goals: p.home_team_goals,
              away_team_goals: p.away_team_goals,
            };
          });
          setUserPredictions(predictionsMap);
        }

        const sortedMatches = [...formatted].sort((a, b) => {
          const aHasPrediction = !!predictionsMap[a.id];
          const bHasPrediction = !!predictionsMap[b.id];
          
          if (aHasPrediction !== bHasPrediction) {
            return aHasPrediction ? 1 : -1;
          }
          
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });

        setMatches(sortedMatches);
      } catch {
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUserId, currentTournament?.id, computedRound]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, matches.length));
  };

  const visibleMatches = matches.slice(0, visibleCount);
  const hasMore = visibleCount < matches.length;

  return (
    <NextMatchesCard
      matches={visibleMatches}
      isLoading={isLoading}
      delay={delay}
      onMatchClick={onMatchClick}
      userPredictions={userPredictions}
      roundNumber={computedRound}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      totalMatches={matches.length}
    />
  );
}

