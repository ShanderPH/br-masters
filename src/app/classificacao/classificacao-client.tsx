"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  Shield,
} from "lucide-react";

import { Navbar } from "@/components/layout";
import { DashboardBackground } from "@/components/dashboard";
import { signOut } from "@/lib/auth/auth-service";

interface ClassificacaoUser {
  id: string;
  name: string;
  points: number;
  level: number;
  role: "user" | "admin";
}

interface TournamentOption {
  id: number;
  name: string;
  fullName: string;
  logo: string;
  seasonId: number | null;
  format: string;
  hasRounds: boolean;
  hasGroups: boolean;
}

interface StandingTeam {
  id: number;
  name: string;
  shortName: string;
  logo: string;
}

interface Standing {
  team: StandingTeam;
  position: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  scoresFor: number;
  scoresAgainst: number;
  goalDifference: number;
  points: number;
}

interface ClassificacaoClientProps {
  user: ClassificacaoUser;
  tournaments: TournamentOption[];
}

const PositionCell = ({ position }: { position: number }) => {
  const getZoneColor = (pos: number) => {
    if (pos <= 4) return "bg-blue-500/80";
    if (pos <= 6) return "bg-blue-500/40";
    if (pos <= 12) return "bg-yellow-500/30";
    if (pos >= 17) return "bg-red-500/60";
    return "bg-white/5";
  };

  return (
    <div
      className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-display font-black tabular-nums ${getZoneColor(position)}`}
    >
      {position}
    </div>
  );
};

const StandingsTable = ({ standings }: { standings: Standing[] }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider w-6">#</th>
            <th className="text-left py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider">Time</th>
            <th className="text-center py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider w-8">P</th>
            <th className="text-center py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider w-8">J</th>
            <th className="text-center py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider w-8">V</th>
            <th className="text-center py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider w-8">E</th>
            <th className="text-center py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider w-8">D</th>
            <th className="text-center py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider w-8">GP</th>
            <th className="text-center py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider w-8">GC</th>
            <th className="text-center py-2 px-1 font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase tracking-wider w-8">SG</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => (
            <motion.tr
              key={row.team.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`
                border-b border-white/5 transition-colors hover:bg-white/5
                ${row.position <= 4 ? "border-l-2 border-l-blue-500" : ""}
                ${row.position >= 17 ? "border-l-2 border-l-red-500" : ""}
              `}
            >
              <td className="py-1.5 px-1">
                <PositionCell position={row.position} />
              </td>
              <td className="py-1.5 px-1">
                <div className="flex items-center gap-2">
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0">
                    <Image
                      src={row.team.logo}
                      alt={row.team.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="font-display font-bold text-[10px] sm:text-xs text-brm-text-primary uppercase truncate">
                    {row.team.shortName || row.team.name}
                  </span>
                </div>
              </td>
              <td className="py-1.5 px-1 text-center">
                <span className="font-display font-black text-xs sm:text-sm text-brm-primary tabular-nums">
                  {row.points}
                </span>
              </td>
              <td className="py-1.5 px-1 text-center font-display text-[10px] sm:text-xs text-brm-text-muted tabular-nums">{row.matches}</td>
              <td className="py-1.5 px-1 text-center font-display text-[10px] sm:text-xs text-green-400 tabular-nums">{row.wins}</td>
              <td className="py-1.5 px-1 text-center font-display text-[10px] sm:text-xs text-yellow-400 tabular-nums">{row.draws}</td>
              <td className="py-1.5 px-1 text-center font-display text-[10px] sm:text-xs text-red-400 tabular-nums">{row.losses}</td>
              <td className="py-1.5 px-1 text-center font-display text-[10px] sm:text-xs text-brm-text-muted tabular-nums">{row.scoresFor}</td>
              <td className="py-1.5 px-1 text-center font-display text-[10px] sm:text-xs text-brm-text-muted tabular-nums">{row.scoresAgainst}</td>
              <td className={`py-1.5 px-1 text-center font-display font-bold text-[10px] sm:text-xs tabular-nums ${row.goalDifference > 0 ? "text-green-400" : row.goalDifference < 0 ? "text-red-400" : "text-brm-text-muted"}`}>
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ZoneLegend = () => (
  <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/5">
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 bg-blue-500/80" />
      <span className="font-display text-[9px] text-brm-text-muted uppercase">Libertadores</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 bg-blue-500/40" />
      <span className="font-display text-[9px] text-brm-text-muted uppercase">Pré-Libertadores</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 bg-red-500/60" />
      <span className="font-display text-[9px] text-brm-text-muted uppercase">Rebaixamento</span>
    </div>
  </div>
);

export function ClassificacaoClient({
  user,
  tournaments,
}: ClassificacaoClientProps) {
  const router = useRouter();
  const [selectedTournament, setSelectedTournament] = useState(tournaments[0]?.id || 0);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentTournament = tournaments.find((t) => t.id === selectedTournament);

  const fetchStandings = useCallback(async (tournamentId: number) => {
    setLoading(true);
    setError(null);

    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament || !tournament.seasonId) {
      setStandings([]);
      setLoading(false);
      setError("Torneio sem dados de temporada");
      return;
    }

    try {
      const res = await fetch(
        `/api/sofascore/standings?tournamentId=${tournamentId}&seasonId=${tournament.seasonId}`
      );

      if (!res.ok) {
        throw new Error("Falha ao carregar classificação");
      }

      const data = await res.json();
      setStandings(data.standings || []);
    } catch {
      setError("Erro ao carregar classificação");
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, [tournaments]);

  useEffect(() => {
    if (selectedTournament) {
      fetchStandings(selectedTournament);
    }
  }, [selectedTournament, fetchStandings]);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const handleTournamentChange = (tournamentId: number) => {
    setSelectedTournament(tournamentId);
  };

  return (
    <div className="min-h-screen relative">
      <DashboardBackground />

      <div className="relative z-10">
        <Navbar
          isAuthenticated={true}
          user={{
            id: user.id,
            name: user.name,
            points: user.points,
            level: user.level,
            role: user.role,
          }}
          onLogout={handleLogout}
        />

        <main className="container mx-auto px-3 sm:px-4 md:px-6 pt-20 md:pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-5"
          >
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors -skew-x-6"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-brm-text-primary skew-x-6" />
            </button>
            <div>
              <h1 className="font-display font-black text-xl sm:text-2xl uppercase italic text-brm-text-primary flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-brm-secondary" />
                Classificação
              </h1>
              <p className="font-display text-xs text-brm-text-muted uppercase tracking-wider">
                Tabela de classificação dos torneios
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1"
          >
            {tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTournamentChange(t.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 -skew-x-6 whitespace-nowrap
                  font-display font-bold text-xs uppercase tracking-wide
                  transition-all duration-200 shrink-0
                  ${
                    selectedTournament === t.id
                      ? "bg-brm-primary/30 text-brm-primary border border-brm-primary/50"
                      : "bg-white/5 text-brm-text-muted border border-white/10 hover:bg-white/10"
                  }
                `}
              >
                <div className="relative w-4 h-4 skew-x-6">
                  <Image src={t.logo} alt={t.name} fill className="object-contain" />
                </div>
                <span className="skew-x-6">{t.name}</span>
              </button>
            ))}
          </motion.div>

          {currentTournament && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-3 mb-4 p-3 bg-brm-card/40 border border-white/5"
            >
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src={currentTournament.logo}
                  alt={currentTournament.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="font-display font-black text-sm uppercase italic text-brm-text-primary">
                  {currentTournament.fullName}
                </p>
                <p className="font-display text-[10px] text-brm-text-muted uppercase">
                  {currentTournament.format === "league" ? "Pontos Corridos" : "Mata-Mata"}
                  {standings.length > 0 && ` • ${standings[0]?.matches || 0} rodadas`}
                </p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTournament}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-brm-primary mb-3" />
                  <p className="font-display text-xs text-brm-text-muted uppercase">
                    Carregando classificação...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Shield className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-display text-sm text-brm-text-muted">{error}</p>
                  <button
                    onClick={() => fetchStandings(selectedTournament)}
                    className="mt-4 px-6 py-2 bg-brm-primary/20 hover:bg-brm-primary/40 border border-brm-primary/30 text-brm-primary font-display font-bold text-xs uppercase -skew-x-6 transition-colors"
                  >
                    <span className="skew-x-6">Tentar novamente</span>
                  </button>
                </div>
              ) : standings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-display text-sm text-brm-text-muted">
                    Classificação não disponível
                  </p>
                </div>
              ) : (
                <div className="bg-brm-card/30 border border-white/5 p-2 sm:p-4">
                  <StandingsTable standings={standings} />
                  {currentTournament?.format === "league" && <ZoneLegend />}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
