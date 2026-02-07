"use client";

import { useState, useEffect } from "react";
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

const getTeamLogoPath = (teamName: string): string => {
  const teamLogoMap: Record<string, string> = {
    "Atlético Mineiro": "atletico-mg",
    "Atlético-MG": "atletico-mg",
    Bahia: "bahia",
    Botafogo: "botafogo",
    Ceará: "ceara",
    Corinthians: "corinthians",
    Cruzeiro: "cruzeiro",
    Flamengo: "flamengo",
    Fluminense: "fluminense",
    Fortaleza: "fortaleza",
    Grêmio: "gremio",
    Internacional: "internacional",
    Juventude: "juventude",
    Mirassol: "mirassol",
    Palmeiras: "palmeiras",
    "Red Bull Bragantino": "bragantino",
    Bragantino: "bragantino",
    Santos: "santos",
    "São Paulo": "saopaulo",
    "Sport Recife": "sport",
    Sport: "sport",
    "Vasco da Gama": "vasco",
    Vasco: "vasco",
    Vitória: "vitoria",
  };

  const mapped = teamLogoMap[teamName];
  if (mapped) return `/images/logo/${mapped}.svg`;

  const slug = teamName
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
  return `/images/logo/${slug}.svg`;
};

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
}

const UrgencyBadge = ({ hoursUntilMatch }: { hoursUntilMatch: number }) => {
  if (hoursUntilMatch > 24) return null;

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
  const isUrgent = hoursUntilMatch <= 24 && hoursUntilMatch > 0;

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
      {isUrgent && !hasStarted && <UrgencyBadge hoursUntilMatch={hoursUntilMatch} />}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px]">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14">
              <Image
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                fill
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
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            whileHover={{
              scale: 1.03,
              transition: { duration: 0.3, ease: "easeOut" },
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`
              w-full py-2 sm:py-2.5 rounded-md
              font-display font-bold text-[10px] sm:text-xs uppercase tracking-wide
              flex items-center justify-center gap-1.5 sm:gap-2
              transition-all duration-500 ease-out
              shadow-lg
              ${
                hasPrediction
                  ? "bg-brm-secondary/20 hover:bg-brm-secondary/30 text-brm-secondary border border-brm-secondary/30 shadow-brm-secondary/20"
                  : "bg-brm-primary hover:bg-brm-primary/80 text-white shadow-brm-primary/30"
              }
            `}
          >
            {hasPrediction ? (
              <>
                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Editar Palpite</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Fazer Palpite</span>
              </>
            )}
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
}: NextMatchesCardProps) {
  const router = useRouter();
  const displayMatches = matches.slice(0, 4);

  const totalMatches = displayMatches.length;
  const predictedMatches = displayMatches.filter((m) => userPredictions[m.id]).length;

  const now = new Date();
  const urgentMatches = displayMatches.filter((m) => {
    const hoursUntil =
      (new Date(m.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 24;
  }).length;

  if (isLoading) {
    return (
      <VerticalTile colorTheme="teal" delay={delay}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-brm-primary" />
        </div>
      </VerticalTile>
    );
  }

  if (displayMatches.length === 0) {
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
    <VerticalTile title="Próximas" subtitle="Partidas" colorTheme="teal" delay={delay}>
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-brm-secondary" />
              <span className="text-[10px] sm:text-xs text-gray-400">
                <span className="font-bold text-brm-secondary">{predictedMatches}</span>/
                {totalMatches} palpites
              </span>
            </div>
            {urgentMatches > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full">
                <Zap className="w-3 h-3 text-orange-400" />
                <span className="text-[9px] sm:text-[10px] text-orange-400 font-bold">
                  {urgentMatches} hoje
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`
            flex-1 flex flex-col gap-2 sm:gap-3
            min-h-0
            max-h-[280px] sm:max-h-[320px] md:max-h-[380px]
            overflow-y-auto overflow-x-hidden
            custom-scrollbar
            scroll-smooth
            relative
          `}
        >
          <AnimatePresence mode="popLayout">
            {displayMatches.map((match, index) => (
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

        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/partidas")}
            className={`
              w-full py-3 sm:py-3.5 cursor-pointer rounded-lg
              bg-linear-to-r from-brm-purple/30 to-brm-purple/20
              hover:from-brm-purple/50 hover:to-brm-purple/30
              border border-brm-purple/30 hover:border-brm-purple/50
              text-brm-purple-foreground hover:text-white
              text-xs sm:text-sm font-display font-bold uppercase tracking-wide
              transition-all duration-300
              flex items-center justify-center gap-2
            `}
          >
            Ver Todas as Partidas
            <ChevronRight className="w-4 h-4" />
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPredictions, setUserPredictions] = useState<Record<string, MatchPrediction>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        const { data: matchesData } = await supabase
          .from("matches")
          .select(`
            id,
            slug,
            start_time,
            status,
            round_number,
            home_team_id,
            away_team_id,
            tournament_id
          `)
          .gt("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(6);

        type MatchRow = {
          id: string;
          slug: string;
          start_time: string;
          status: string;
          round_number: number | null;
          home_team_id: string;
          away_team_id: string;
          tournament_id: string;
        };

        const dbMatches = matchesData as MatchRow[] | null;

        if (dbMatches && dbMatches.length > 0) {
          const teamIds = [
            ...new Set(dbMatches.flatMap((m) => [m.home_team_id, m.away_team_id])),
          ];

          const { data: teamsData } = await supabase
            .from("teams")
            .select("id, name, name_code, logo_url")
            .in("id", teamIds);

          type TeamRow = {
            id: string;
            name: string;
            name_code: string;
            logo_url: string | null;
          };

          const teams = teamsData as TeamRow[] | null;
          const teamsMap = new Map<string, TeamRow>();
          if (teams) {
            teams.forEach((t) => teamsMap.set(t.id, t));
          }

          const formatted: Match[] = dbMatches.map((m) => {
            const homeTeam = teamsMap.get(m.home_team_id);
            const awayTeam = teamsMap.get(m.away_team_id);

            return {
              id: m.id,
              homeTeam: {
                id: m.home_team_id,
                name: homeTeam?.name || "Time Casa",
                shortName: homeTeam?.name_code,
                logo: homeTeam?.logo_url || getTeamLogoPath(homeTeam?.name || ""),
              },
              awayTeam: {
                id: m.away_team_id,
                name: awayTeam?.name || "Time Fora",
                shortName: awayTeam?.name_code,
                logo: awayTeam?.logo_url || getTeamLogoPath(awayTeam?.name || ""),
              },
              startTime: m.start_time,
              status: m.status,
              roundNumber: m.round_number || undefined,
            };
          });

          setMatches(formatted);

          if (currentUserId) {
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

            const predictions = predictionsData as PredictionRow[] | null;
            if (predictions) {
              const predictionsMap: Record<string, MatchPrediction> = {};
              predictions.forEach((p) => {
                predictionsMap[p.match_id] = {
                  home_team_goals: p.home_team_goals,
                  away_team_goals: p.away_team_goals,
                };
              });
              setUserPredictions(predictionsMap);
            }
          }
        }
      } catch {
        // Keep default empty state
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  return (
    <NextMatchesCard
      matches={matches}
      isLoading={isLoading}
      delay={delay}
      onMatchClick={onMatchClick}
      userPredictions={userPredictions}
    />
  );
}

