"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronRight, ChevronLeft, Calendar, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FeatureTile } from "./bento-grid";
import { createClient } from "@/lib/supabase/client";


const getTeamLogoPath = (teamName: string): string => {
  const teamLogoMap: Record<string, string> = {
    "Atlético Mineiro": "atletico-mg",
    "Atlético-MG": "atletico-mg",
    "Bahia": "bahia",
    "Botafogo": "botafogo",
    "Ceará": "ceara",
    "Corinthians": "corinthians",
    "Cruzeiro": "cruzeiro",
    "Flamengo": "flamengo",
    "Fluminense": "fluminense",
    "Fortaleza": "fortaleza",
    "Grêmio": "gremio",
    "Internacional": "internacional",
    "Juventude": "juventude",
    "Mirassol": "mirassol",
    "Palmeiras": "palmeiras",
    "Red Bull Bragantino": "bragantino",
    "Bragantino": "bragantino",
    "Santos": "santos",
    "São Paulo": "saopaulo",
    "Sport Recife": "sport",
    "Sport": "sport",
    "Vasco da Gama": "vasco",
    "Vasco": "vasco",
    "Vitória": "vitoria",
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

interface LastChampion {
  year: string;
  team_name: string;
  team_id: number;
}

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

interface Tournament {
  id: number;
  name: string;
  short_name?: string;
  logo_url?: string;
  wallpaper_url?: string;
  status: "upcoming" | "active" | "finished";
  current_round_type?: string;
  current_round_number?: number;
  most_titles_team_name?: string;
  most_titles_count?: number;
  last_champions?: LastChampion[];
  sofascore_id?: number;
  sofascore_season_id?: number;
}

interface TournamentCardProps {
  tournaments?: Tournament[];
  isLoading?: boolean;
  delay?: number;
}

const StatusBadge = ({ status }: { status: Tournament["status"] }) => {
  const config = {
    upcoming: {
      label: "A Iniciar",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      pulse: false,
    },
    active: {
      label: "Em Andamento",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
      pulse: true,
    },
    finished: {
      label: "Finalizado",
      className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      pulse: false,
    },
  };

  const { label, className, pulse } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase rounded-sm border ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
      {label}
    </span>
  );
};

const StandingsTable = ({ standings, maxTeams = 10 }: { standings: StandingTeam[]; maxTeams?: number }) => {
  if (!standings || standings.length === 0) return null;

  const displayStandings = standings.slice(0, maxTeams);

  return (
    <div className="mt-3 space-y-0.5">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-3 h-3 text-yellow-400" />
        <span className="font-display text-[10px] text-brm-text-secondary dark:text-gray-400 uppercase tracking-wider">
          Classificação
        </span>
        <span className="font-display text-[8px] text-brm-text-muted dark:text-gray-500 ml-auto">
          Top {maxTeams}
        </span>
      </div>
      <div className="max-h-[180px] md:max-h-[220px] overflow-y-auto custom-scrollbar space-y-0.5">
        {displayStandings.map((standing, idx) => (
          <motion.div
            key={standing.team.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`
              flex items-center gap-1.5 py-1 px-2 -skew-x-3
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

export function TournamentCard({
  tournaments = [],
  isLoading = false,
  delay = 0,
}: TournamentCardProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);

  const currentTournament = tournaments[currentIndex];

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % tournaments.length);
  }, [tournaments.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + tournaments.length) % tournaments.length);
  }, [tournaments.length]);

  useEffect(() => {
    const fetchStandings = async () => {
      setLoadingStandings(true);
      try {
        const tournamentId = currentTournament?.sofascore_id || 325;
        const seasonId = currentTournament?.sofascore_season_id || 72034;
        
        const response = await fetch(
          `/api/sofascore/standings?tournamentId=${tournamentId}&seasonId=${seasonId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.standings && Array.isArray(data.standings)) {
            setStandings(data.standings);
          } else {
            setStandings([]);
          }
        } else {
          setStandings([]);
        }
      } catch {
        setStandings([]);
      } finally {
        setLoadingStandings(false);
      }
    };

    if (currentTournament) {
      fetchStandings();
    }
  }, [currentTournament]);

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
      bgImage={currentTournament.wallpaper_url}
      onClick={() => router.push(`/partidas`)}
      className="min-h-[280px] md:min-h-[320px]"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-lg p-1.5 shrink-0 backdrop-blur-md shadow-lg">
              <Image
                src={currentTournament.logo_url || "/images/brasileirao-logo.svg"}
                alt={currentTournament.name}
                fill
                className="object-contain p-1"
              />
            </div>

            <div>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={currentTournament.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-display font-black text-lg md:text-2xl uppercase italic leading-tight text-brm-text-primary dark:text-white drop-shadow-lg"
                >
                  {currentTournament.short_name || currentTournament.name}
                </motion.h2>
              </AnimatePresence>
              <StatusBadge status={currentTournament.status} />
            </div>
          </div>

          {tournaments.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              <span className="text-[10px] text-gray-500 font-display">
                {currentIndex + 1}/{tournaments.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {currentTournament.current_round_type && (
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-brm-accent" />
            <span className="text-sm md:text-base text-brm-text-primary dark:text-white font-semibold">
              {currentTournament.current_round_type}
            </span>
            {currentTournament.current_round_number && (
              <span className="text-xs text-brm-text-muted dark:text-gray-400">
                (Rodada {currentTournament.current_round_number})
              </span>
            )}
          </div>
        )}

        {currentTournament.most_titles_team_name && currentTournament.most_titles_count && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="relative flex items-center gap-2 bg-linear-to-r from-yellow-500/20 to-amber-500/10 border-l-2 border-yellow-500 px-3 py-1.5 -skew-x-6">
              <div className="skew-x-6 flex items-center gap-2">
                <div className="relative w-6 h-6 md:w-8 md:h-8 shrink-0">
                  <Image
                    src={getTeamLogoPath(currentTournament.most_titles_team_name)}
                    alt={currentTournament.most_titles_team_name}
                    fill
                    className="object-contain drop-shadow-lg"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-[8px] md:text-[10px] text-yellow-400/80 font-bold uppercase tracking-wider">
                    Maior Campeão
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-display text-xs md:text-sm text-brm-text-primary dark:text-white font-black uppercase italic">
                      {currentTournament.most_titles_team_name}
                    </span>
                    <span className="font-display text-xs md:text-sm text-yellow-400 font-bold">
                      ({currentTournament.most_titles_count}x)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {loadingStandings ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <StandingsTable standings={standings} />
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          className={`
            w-full md:w-auto mt-auto
            bg-brm-accent text-white font-display font-bold uppercase
            px-4 py-2 md:px-6 md:py-3 text-sm md:text-base
            transform md:-skew-x-12 transition-colors duration-300
            hover:bg-brm-secondary hover:text-brm-background-dark
            shadow-lg hover:shadow-brm-secondary/30
            flex items-center justify-center gap-2
          `}
        >
          <span className="transform md:skew-x-12 flex items-center gap-2 font-display">
            Ver Partidas
            <ChevronRight className="w-4 h-4" />
          </span>
        </motion.button>
      </div>
    </FeatureTile>
  );
}

export function TournamentCardWithData({ delay = 0 }: { delay?: number }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const supabase = createClient();

        const { data: tournamentsData } = await supabase
          .from("tournaments")
          .select("id, name, slug, logo_url, is_featured, display_order, format")
          .eq("is_featured", true)
          .order("display_order", { ascending: true })
          .limit(5);

        const tournaments = tournamentsData as Array<{
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          is_featured: boolean;
          display_order: number;
          format: string;
        }> | null;

        if (tournaments && tournaments.length > 0) {
          const tournamentIds = tournaments.map((t) => t.id);
          
          const { data: seasonsData } = await supabase
            .from("tournament_seasons")
            .select("tournament_id, current_phase, current_round_type, current_round_number, status")
            .eq("is_current", true)
            .in("tournament_id", tournamentIds);

          const seasons = seasonsData as Array<{
            tournament_id: string;
            current_phase: string | null;
            current_round_type: string | null;
            current_round_number: number | null;
            status: string;
          }> | null;

          type SeasonData = {
            tournament_id: string;
            current_phase: string | null;
            current_round_type: string | null;
            current_round_number: number | null;
            status: string;
          };
          
          const seasonsMap = new Map<string, SeasonData>();
          
          if (seasons) {
            seasons.forEach((s) => {
              seasonsMap.set(s.tournament_id, s);
            });
          }

          const formatted: Tournament[] = tournaments.map((t) => {
            const season = seasonsMap.get(t.id);
            return {
              id: parseInt(t.id) || 0,
              name: t.name,
              short_name: t.name,
              logo_url: t.logo_url || "/images/brasileirao-logo.svg",
              wallpaper_url: "/images/wallpaper_brasileirao_2026.png",
              status: (season?.status === "active" ? "active" : "upcoming") as Tournament["status"],
              current_round_type: season?.current_phase || season?.current_round_type || "Fase de Grupos",
              current_round_number: season?.current_round_number || 1,
            };
          });
          setTournaments(formatted);
        } else {
          setTournaments([getDefaultTournament()]);
        }
      } catch {
        setTournaments([getDefaultTournament()]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return <TournamentCard tournaments={tournaments} isLoading={isLoading} delay={delay} />;
}

function getDefaultTournament(): Tournament {
  return {
    id: 325,
    name: "Brasileirão Betano 2026",
    short_name: "Brasileirão",
    logo_url: "/images/brasileirao-logo.svg",
    wallpaper_url: "/images/wallpaper_brasileirao_2026.png",
    status: "active",
    current_round_type: "Rodada 1",
    current_round_number: 1,
    most_titles_team_name: "Palmeiras",
    most_titles_count: 12,
    last_champions: [
      { year: "2025", team_name: "Botafogo", team_id: 1958 },
      { year: "2024", team_name: "Botafogo", team_id: 1958 },
      { year: "2023", team_name: "Palmeiras", team_id: 1963 },
    ],
  };
}
