"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Target,
  Zap,
  Lock,
  Users,
} from "lucide-react";

import { Navbar } from "@/components/layout";
import { DashboardBackground } from "@/components/dashboard";
import { signOut } from "@/lib/auth/auth-service";
import { getTeamLogoPath } from "@/lib/services/team-logo-service";

interface PalpitesUser {
  id: string;
  name: string;
  points: number;
  level: number;
  role: "user" | "admin";
}

interface PredictionMatch {
  id: number;
  homeTeamName: string;
  homeTeamShortName: string | null;
  homeTeamLogo: string | null;
  awayTeamName: string;
  awayTeamShortName: string | null;
  awayTeamLogo: string | null;
  startTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}

interface Prediction {
  id: string;
  matchId: number;
  homeTeamGoals: number;
  awayTeamGoals: number;
  pointsEarned: number;
  isCorrect: boolean;
  isExactScore: boolean;
  tournamentId: number;
  roundNumber: number;
  predictedAt: string;
  match: PredictionMatch;
}

interface TournamentOption {
  id: number;
  name: string;
  logo: string;
}

interface OtherPrediction {
  matchId: number;
  oddsUserId: string;
  userName: string;
  userTeamLogo: string | null;
  homeTeamGoals: number;
  awayTeamGoals: number;
  pointsEarned: number;
  isCorrect: boolean;
  isExactScore: boolean;
}

interface PalpitesClientProps {
  user: PalpitesUser;
  predictions: Prediction[];
  tournaments: TournamentOption[];
  currentRounds: Record<number, number>;
  otherPredictionsByMatch: Record<number, OtherPrediction[]>;
}

const ResultBadge = ({ prediction }: { prediction: Prediction }) => {
  const isFinished = prediction.match.status === "finished";

  if (!isFinished) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 -skew-x-6">
        <Clock className="w-3 h-3 text-yellow-400 skew-x-6" />
        <span className="text-[10px] font-display font-bold text-yellow-400 uppercase skew-x-6">
          Aguardando
        </span>
      </div>
    );
  }

  if (prediction.isExactScore) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-brm-secondary/20 -skew-x-6">
        <Star className="w-3 h-3 text-brm-secondary skew-x-6" />
        <span className="text-[10px] font-display font-bold text-brm-secondary uppercase skew-x-6">
          Exato! +{prediction.pointsEarned}
        </span>
      </div>
    );
  }

  if (prediction.isCorrect) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 -skew-x-6">
        <CheckCircle2 className="w-3 h-3 text-green-400 skew-x-6" />
        <span className="text-[10px] font-display font-bold text-green-400 uppercase skew-x-6">
          Acertou +{prediction.pointsEarned}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 -skew-x-6">
      <XCircle className="w-3 h-3 text-red-400 skew-x-6" />
      <span className="text-[10px] font-display font-bold text-red-400 uppercase skew-x-6">
        Errou
      </span>
    </div>
  );
};

const OtherUserPredictionRow = ({
  pred,
  isFinished,
}: {
  pred: OtherPrediction;
  isFinished: boolean;
}) => {
  const getBadgeColor = () => {
    if (!isFinished) return "text-gray-500";
    if (pred.isExactScore) return "text-brm-secondary";
    if (pred.isCorrect) return "text-green-400";
    return "text-red-400";
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 sm:px-3 border-b border-white/5 last:border-b-0">
      <div className="relative w-4 h-4 shrink-0">
        {pred.userTeamLogo ? (
          <Image src={pred.userTeamLogo} alt="" fill className="object-contain" />
        ) : (
          <div className="w-full h-full bg-gray-700 rounded-full" />
        )}
      </div>
      <span className="flex-1 font-display font-bold text-[10px] sm:text-xs text-brm-text-primary uppercase truncate">
        {pred.userName}
      </span>
      {isFinished ? (
        <>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 -skew-x-6">
            <span className={`font-display font-black text-xs skew-x-6 ${getBadgeColor()}`}>
              {pred.homeTeamGoals}
            </span>
            <span className="text-[10px] text-gray-600 font-bold skew-x-6">×</span>
            <span className={`font-display font-black text-xs skew-x-6 ${getBadgeColor()}`}>
              {pred.awayTeamGoals}
            </span>
          </div>
          <span className={`font-display font-bold text-[10px] tabular-nums shrink-0 ${getBadgeColor()}`}>
            {pred.isExactScore ? `+${pred.pointsEarned}` : pred.isCorrect ? `+${pred.pointsEarned}` : "0"}
          </span>
        </>
      ) : (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 -skew-x-6">
          <Lock className="w-3 h-3 text-gray-600 skew-x-6" />
          <span className="font-display text-[10px] text-gray-600 uppercase skew-x-6">Bloqueado</span>
        </div>
      )}
    </div>
  );
};

const PredictionCard = ({
  prediction,
  otherPredictions,
}: {
  prediction: Prediction;
  otherPredictions: OtherPrediction[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const match = prediction.match;
  const isFinished = match.status === "finished";
  const matchDate = new Date(match.startTime);
  const othersCount = otherPredictions.length;

  const homeLogo = match.homeTeamLogo || getTeamLogoPath(match.homeTeamName);
  const awayLogo = match.awayTeamLogo || getTeamLogoPath(match.awayTeamName);

  const sortedOthers = isFinished
    ? [...otherPredictions].sort((a, b) => b.pointsEarned - a.pointsEarned)
    : otherPredictions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative
        bg-brm-card/80 border border-white/5
        hover:border-white/10 transition-all duration-200
        ${prediction.isExactScore ? "border-l-4 border-l-brm-secondary" : ""}
        ${prediction.isCorrect && !prediction.isExactScore ? "border-l-4 border-l-green-500" : ""}
        ${isFinished && !prediction.isCorrect ? "border-l-4 border-l-red-500/50" : ""}
        ${!isFinished ? "border-l-4 border-l-yellow-500/50" : ""}
      `}
    >
      <button
        onClick={() => othersCount > 0 && setIsExpanded(!isExpanded)}
        className={`w-full text-left p-3 sm:p-4 ${othersCount > 0 ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-display text-[10px] text-brm-text-muted uppercase tracking-wider">
            {matchDate.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })}{" "}
            •{" "}
            {matchDate.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <ResultBadge prediction={prediction} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
              <Image src={homeLogo} alt={match.homeTeamName} fill className="object-contain" />
            </div>
            <span className="font-display font-bold text-xs sm:text-sm text-brm-text-primary uppercase truncate">
              {match.homeTeamShortName || match.homeTeamName.split(" ")[0]}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-brm-primary/10 -skew-x-6">
              <span className="font-display font-black text-base sm:text-lg text-brm-primary skew-x-6">
                {prediction.homeTeamGoals}
              </span>
              <span className="text-xs text-gray-500 font-bold skew-x-6">×</span>
              <span className="font-display font-black text-base sm:text-lg text-brm-primary skew-x-6">
                {prediction.awayTeamGoals}
              </span>
            </div>

            {isFinished && match.homeScore !== null && match.awayScore !== null && (
              <div className="flex items-center gap-1 text-[10px] text-brm-text-muted font-display">
                <span>Real:</span>
                <span className="font-bold text-white">
                  {match.homeScore} × {match.awayScore}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="font-display font-bold text-xs sm:text-sm text-brm-text-primary uppercase truncate text-right">
              {match.awayTeamShortName || match.awayTeamName.split(" ")[0]}
            </span>
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
              <Image src={awayLogo} alt={match.awayTeamName} fill className="object-contain" />
            </div>
          </div>
        </div>

        {othersCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-white/5">
            <Users className="w-3 h-3 text-brm-text-muted" />
            <span className="font-display text-[10px] text-brm-text-muted uppercase">
              {othersCount} {othersCount === 1 ? "palpite" : "palpites"} de outros jogadores
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-brm-text-muted" />
            </motion.div>
          </div>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && othersCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="bg-white/2 border border-white/5">
                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 border-b border-white/5 bg-white/2">
                  <Users className="w-3 h-3 text-brm-text-muted" />
                  <span className="font-display text-[9px] text-brm-text-muted uppercase tracking-wider">
                    Palpites dos jogadores
                  </span>
                  {!isFinished && (
                    <span className="ml-auto flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-yellow-500/60" />
                      <span className="font-display text-[8px] text-yellow-500/60 uppercase">Aguardando resultado</span>
                    </span>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {sortedOthers.map((op) => (
                    <OtherUserPredictionRow
                      key={op.oddsUserId}
                      pred={op}
                      isFinished={isFinished}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export function PalpitesClient({
  user,
  predictions,
  tournaments,
  currentRounds,
  otherPredictionsByMatch,
}: PalpitesClientProps) {
  const router = useRouter();

  const defaultTournament = tournaments[0]?.id || 0;
  const defaultRound = currentRounds[defaultTournament] || 1;

  const [selectedTournament, setSelectedTournament] = useState(defaultTournament);
  const [selectedRound, setSelectedRound] = useState(defaultRound);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const tournamentPredictions = useMemo(
    () => predictions.filter((p) => p.tournamentId === selectedTournament),
    [predictions, selectedTournament]
  );

  const availableRounds = useMemo(() => {
    const rounds = new Set(tournamentPredictions.map((p) => p.roundNumber));
    return Array.from(rounds).sort((a, b) => b - a);
  }, [tournamentPredictions]);

  const roundPredictions = useMemo(
    () => tournamentPredictions.filter((p) => p.roundNumber === selectedRound),
    [tournamentPredictions, selectedRound]
  );

  const stats = useMemo(() => {
    const total = roundPredictions.length;
    const finished = roundPredictions.filter((p) => p.match.status === "finished");
    const correct = finished.filter((p) => p.isCorrect).length;
    const exact = finished.filter((p) => p.isExactScore).length;
    const points = roundPredictions.reduce((sum, p) => sum + p.pointsEarned, 0);
    return { total, correct, exact, points, finishedCount: finished.length };
  }, [roundPredictions]);

  const handleTournamentChange = (tournamentId: number) => {
    setSelectedTournament(tournamentId);
    const newRound = currentRounds[tournamentId] || 1;
    setSelectedRound(newRound);
  };

  const handlePrevRound = () => {
    const idx = availableRounds.indexOf(selectedRound);
    if (idx < availableRounds.length - 1) {
      setSelectedRound(availableRounds[idx + 1]);
    }
  };

  const handleNextRound = () => {
    const idx = availableRounds.indexOf(selectedRound);
    if (idx > 0) {
      setSelectedRound(availableRounds[idx - 1]);
    }
  };

  const canGoPrev = availableRounds.indexOf(selectedRound) < availableRounds.length - 1;
  const canGoNext = availableRounds.indexOf(selectedRound) > 0;

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
                <Target className="w-6 h-6 text-brm-primary" />
                Meus Palpites
              </h1>
              <p className="font-display text-xs text-brm-text-muted uppercase tracking-wider">
                Histórico de palpites realizados
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1"
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-between mb-4"
          >
            <button
              onClick={handlePrevRound}
              disabled={!canGoPrev}
              className={`p-2 -skew-x-6 transition-colors ${canGoPrev ? "hover:bg-white/10 text-brm-text-primary" : "text-gray-600 cursor-not-allowed"}`}
              aria-label="Rodada anterior"
            >
              <ChevronLeft className="w-5 h-5 skew-x-6" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm sm:text-base uppercase italic text-brm-text-primary">
                Rodada {selectedRound}
              </span>
              {selectedRound === (currentRounds[selectedTournament] || 0) && (
                <span className="px-2 py-0.5 bg-brm-primary/20 text-brm-primary text-[9px] font-display font-bold uppercase -skew-x-6">
                  <span className="skew-x-6">Atual</span>
                </span>
              )}
            </div>

            <button
              onClick={handleNextRound}
              disabled={!canGoNext}
              className={`p-2 -skew-x-6 transition-colors ${canGoNext ? "hover:bg-white/10 text-brm-text-primary" : "text-gray-600 cursor-not-allowed"}`}
              aria-label="Próxima rodada"
            >
              <ChevronRight className="w-5 h-5 skew-x-6" />
            </button>
          </motion.div>

          {stats.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-4 gap-2 mb-5"
            >
              <div className="bg-brm-card/60 border border-white/5 p-2 sm:p-3 text-center -skew-x-3">
                <div className="skew-x-3">
                  <p className="font-display font-black text-lg sm:text-xl text-brm-primary tabular-nums">
                    {stats.total}
                  </p>
                  <p className="font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase">
                    Palpites
                  </p>
                </div>
              </div>
              <div className="bg-brm-card/60 border border-white/5 p-2 sm:p-3 text-center -skew-x-3">
                <div className="skew-x-3">
                  <p className="font-display font-black text-lg sm:text-xl text-green-400 tabular-nums">
                    {stats.correct}
                  </p>
                  <p className="font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase">
                    Acertos
                  </p>
                </div>
              </div>
              <div className="bg-brm-card/60 border border-white/5 p-2 sm:p-3 text-center -skew-x-3">
                <div className="skew-x-3">
                  <p className="font-display font-black text-lg sm:text-xl text-brm-secondary tabular-nums">
                    {stats.exact}
                  </p>
                  <p className="font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase">
                    Exatos
                  </p>
                </div>
              </div>
              <div className="bg-brm-card/60 border border-white/5 p-2 sm:p-3 text-center -skew-x-3">
                <div className="skew-x-3">
                  <p className="font-display font-black text-lg sm:text-xl text-yellow-400 tabular-nums">
                    {stats.points}
                  </p>
                  <p className="font-display text-[9px] sm:text-[10px] text-brm-text-muted uppercase">
                    Pontos
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedTournament}-${selectedRound}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-2"
            >
              {roundPredictions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Zap className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-display text-sm text-brm-text-muted text-center">
                    Nenhum palpite nesta rodada
                  </p>
                  <button
                    onClick={() => router.push("/partidas")}
                    className="mt-4 px-6 py-2 bg-brm-primary/20 hover:bg-brm-primary/40 border border-brm-primary/30 text-brm-primary font-display font-bold text-xs uppercase -skew-x-6 transition-colors"
                  >
                    <span className="skew-x-6 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Fazer Palpites
                    </span>
                  </button>
                </div>
              ) : (
                roundPredictions.map((prediction) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    otherPredictions={otherPredictionsByMatch[prediction.matchId] || []}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>

          {predictions.length > 0 && availableRounds.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 pt-4 border-t border-white/5"
            >
              <p className="font-display text-[10px] text-brm-text-muted uppercase tracking-wider text-center mb-3">
                Rodadas com palpites
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {availableRounds.map((round) => (
                  <button
                    key={round}
                    onClick={() => setSelectedRound(round)}
                    className={`
                      w-8 h-8 flex items-center justify-center
                      font-display font-bold text-xs -skew-x-6 transition-all
                      ${
                        round === selectedRound
                          ? "bg-brm-primary text-white"
                          : round === (currentRounds[selectedTournament] || 0)
                            ? "bg-brm-primary/20 text-brm-primary border border-brm-primary/30"
                            : "bg-white/5 text-brm-text-muted hover:bg-white/10"
                      }
                    `}
                  >
                    <span className="skew-x-6">{round}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
