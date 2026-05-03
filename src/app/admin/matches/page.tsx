"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Button, Modal, TextField, Input, Label, Tabs, AlertDialog } from "@heroui/react";
import {
  Swords,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Globe,
  CheckCircle,
  Calculator,
  Target,
  Undo2,
} from "lucide-react";
import Image from "next/image";

import { useAdminCrud, useSofascoreApi } from "@/hooks/use-admin-crud";

interface MatchRowRaw {
  id: string;
  round_number: number;
  round_name: string | null;
  home_team_id: string;
  away_team_id: string;
  start_time: string;
  status: string;
  home_score: number;
  away_score: number;
  tournament_id: string;
  season_id: string | null;
  home_team: { name: string; name_code: string | null; logo_url: string | null } | null;
  away_team: { name: string; name_code: string | null; logo_url: string | null } | null;
  tournaments: { name: string } | null;
}

interface MatchRow {
  id: string;
  round_number: number;
  round_name: string | null;
  home_team_id: string;
  home_team_name: string;
  home_team_short_name: string | null;
  home_team_logo: string | null;
  away_team_id: string;
  away_team_name: string;
  away_team_short_name: string | null;
  away_team_logo: string | null;
  start_time: string;
  status: string;
  home_score: number;
  away_score: number;
  tournament_id: string;
  tournament_name: string;
  season_id: string | null;
}

interface TournamentOption {
  id: string;
  name: string;
  format: string | null;
  sofascore_id: number | null;
}

interface SeasonOption {
  id: string;
  year: string;
  sofascore_season_id: number | null;
  is_current: boolean;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(dateStr));
}

function getStatusLabel(status: string): { label: string; class: string } {
  switch (status) {
    case "finished": return { label: "Finalizado", class: "bg-green-500/20 text-green-400" };
    case "inprogress": return { label: "Ao Vivo", class: "bg-red-500/20 text-red-400 animate-pulse" };
    case "notstarted": return { label: "Agendado", class: "bg-blue-500/20 text-blue-400" };
    case "postponed": return { label: "Adiado", class: "bg-yellow-500/20 text-yellow-400" };
    case "canceled": case "cancelled": return { label: "Cancelado", class: "bg-gray-500/20 text-gray-400" };
    default: return { label: status, class: "bg-gray-500/20 text-gray-400" };
  }
}

export default function MatchesManagementPage() {
  const { list, update, remove, restore, loading: crudLoading } = useAdminCrud();
  const sofascore = useSofascoreApi();

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [roundFilter, setRoundFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const [deleteTarget, setDeleteTarget] = useState<MatchRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePredCount, setDeletePredCount] = useState<number | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [importTournamentId, setImportTournamentId] = useState("");
  const [importSeasonId, setImportSeasonId] = useState("");
  const [importRound, setImportRound] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const selectedTournament = tournaments.find(t => t.id === importTournamentId);
  const selectedSeason = seasons.find(s => s.id === importSeasonId);

  const [editingMatch, setEditingMatch] = useState<MatchRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchTournaments = useCallback(async () => {
    const result = await list<TournamentOption>({
      table: "tournaments",
      select: "id, name, format, sofascore_id",
      orderBy: { column: "display_order", ascending: true },
      limit: 50,
    });
    if (result.data) setTournaments(result.data as TournamentOption[]);
  }, [list]);

  const fetchSeasons = useCallback(async (tournamentId: string) => {
    const result = await list<SeasonOption>({
      table: "tournament_seasons",
      select: "id, year, sofascore_season_id, is_current",
      filters: [{ column: "tournament_id", operator: "eq", value: tournamentId }],
      orderBy: { column: "year", ascending: false },
      limit: 10,
    });
    if (result.data) {
      setSeasons(result.data as SeasonOption[]);
      const current = (result.data as SeasonOption[]).find(s => s.is_current);
      if (current) setImportSeasonId(current.id);
    }
  }, [list]);

  const fetchMatches = useCallback(async () => {
    const filters: { column: string; operator: string; value: unknown }[] = [];

    if (selectedTournamentId) {
      filters.push({ column: "tournament_id", operator: "eq", value: selectedTournamentId });
    }
    if (roundFilter) {
      filters.push({ column: "round_number", operator: "eq", value: Number(roundFilter) });
    }
    if (statusFilter) {
      filters.push({ column: "status", operator: "eq", value: statusFilter });
    }

    const result = await list<MatchRowRaw>({
      table: "matches",
      select: "id, round_number, round_name, home_team_id, away_team_id, start_time, status, home_score, away_score, tournament_id, season_id, home_team:teams!matches_home_team_id_fkey(name, name_code, logo_url), away_team:teams!matches_away_team_id_fkey(name, name_code, logo_url), tournaments(name)",
      filters,
      orderBy: { column: "start_time", ascending: false },
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      onlyDeleted: showDeleted,
    });

    if (result.data) {
      const mapped: MatchRow[] = (result.data as MatchRowRaw[]).map((m) => ({
        id: m.id,
        round_number: m.round_number,
        round_name: m.round_name,
        home_team_id: m.home_team_id,
        home_team_name: m.home_team?.name || "?",
        home_team_short_name: m.home_team?.name_code || null,
        home_team_logo: m.home_team?.logo_url || null,
        away_team_id: m.away_team_id,
        away_team_name: m.away_team?.name || "?",
        away_team_short_name: m.away_team?.name_code || null,
        away_team_logo: m.away_team?.logo_url || null,
        start_time: m.start_time,
        status: m.status,
        home_score: m.home_score,
        away_score: m.away_score,
        tournament_id: m.tournament_id,
        tournament_name: m.tournaments?.name || "?",
        season_id: m.season_id,
      }));
      setMatches(mapped);
      setTotalCount(result.count ?? 0);
    }
  }, [list, selectedTournamentId, roundFilter, statusFilter, page, showDeleted]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTournaments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMatches();
  }, [selectedTournamentId, roundFilter, statusFilter, page, showDeleted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (importTournamentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchSeasons(importTournamentId);
    } else {
      setSeasons([]);
      setImportSeasonId("");
    }
  }, [importTournamentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImportMatches = async () => {
    if (!importTournamentId || !importSeasonId || !selectedTournament?.sofascore_id || !selectedSeason?.sofascore_season_id) {
      setImportStatus("Erro: Selecione torneio e temporada com IDs do SofaScore configurados");
      return;
    }
    setImportStatus("Importando todas as partidas (passadas + futuras, pode demorar)...");
    const result = await sofascore.call<{ total: number; upserted: number; teamsProcessed: number; errors: number; pastCount: number; futureCount: number; roundNumbers: number[] }>({
      action: "import_matches",
      tournamentId: importTournamentId,
      seasonId: importSeasonId,
      sofascoreTournamentId: selectedTournament.sofascore_id,
      sofascoreSeasonId: selectedSeason.sofascore_season_id,
    });
    if (result) {
      const info = [`${result.total} partidas (${result.upserted} processadas, ${result.teamsProcessed} times)`];
      if (result.errors > 0) info.push(`${result.errors} erros`);
      if (result.roundNumbers?.length) info.push(`Rodadas: ${result.roundNumbers[0]}-${result.roundNumbers[result.roundNumbers.length - 1]}`);
      setImportStatus(info.join(" | "));
      fetchMatches();
      setTimeout(() => setImportStatus(null), 8000);
    } else {
      setImportStatus("Erro ao importar");
    }
  };

  const handleImportRound = async () => {
    if (!importTournamentId || !importSeasonId || !importRound || !selectedTournament?.sofascore_id || !selectedSeason?.sofascore_season_id) {
      setImportStatus("Erro: Selecione torneio, temporada e rodada");
      return;
    }
    setImportStatus(`Importando rodada ${importRound}...`);
    const result = await sofascore.call<{ count: number; round: number }>({
      action: "import_round_matches",
      tournamentId: importTournamentId,
      seasonId: importSeasonId,
      sofascoreTournamentId: selectedTournament.sofascore_id,
      sofascoreSeasonId: selectedSeason.sofascore_season_id,
      round: Number(importRound),
    });
    if (result) {
      setImportStatus(`Rodada ${result.round}: ${result.count} partidas importadas`);
      fetchMatches();
      setTimeout(() => setImportStatus(null), 5000);
    } else {
      setImportStatus("Erro ao importar rodada");
    }
  };

  const handleUpdateScores = async () => {
    if (!selectedTournament?.sofascore_id || !selectedSeason?.sofascore_season_id) {
      setImportStatus("Erro: Selecione torneio e temporada com IDs do SofaScore");
      return;
    }
    setImportStatus("Atualizando placares do SofaScore...");
    const result = await sofascore.call<{ updated: number; notFound: number; total: number }>({
      action: "update_match_scores",
      sofascoreTournamentId: selectedTournament.sofascore_id,
      sofascoreSeasonId: selectedSeason.sofascore_season_id,
    });
    if (result) {
      setImportStatus(`${result.updated}/${result.total} placares atualizados! (${result.notFound} não encontrados)`);
      fetchMatches();
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleCalculateScores = async () => {
    if (!importTournamentId) {
      setImportStatus("Erro: Selecione um torneio");
      return;
    }
    setImportStatus("Calculando pontuação dos palpites...");
    const result = await sofascore.call<{ scored: number; totalPredictions: number; matchesProcessed: number; usersUpdated: number }>({
      action: "calculate_scores",
      tournamentId: importTournamentId,
      seasonId: importSeasonId || undefined,
      round: importRound ? Number(importRound) : undefined,
    });
    if (result) {
      setImportStatus(`${result.scored} palpites pontuados de ${result.totalPredictions} total (${result.matchesProcessed} partidas, ${result.usersUpdated} usuários)`);
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const handleEditMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMatch) return;
    const fd = new FormData(e.currentTarget);
    const startTimeLocal = fd.get("start_time") as string;
    
    let startTimeISO = editingMatch.start_time;
    if (startTimeLocal) {
      const date = new Date(startTimeLocal);
      if (!isNaN(date.getTime())) {
        startTimeISO = date.toISOString();
      }
    }
    
    const result = await update("matches", editingMatch.id, {
      round_number: Number(fd.get("round_number")),
      status: fd.get("status") as string,
      home_score: Number(fd.get("home_score")),
      away_score: Number(fd.get("away_score")),
      start_time: startTimeISO,
    });
    
    if (result.error) {
      console.error("Error updating match:", result.error);
      return;
    }
    
    setIsEditOpen(false);
    setEditingMatch(null);
    fetchMatches();
  };

  const openDeleteDialog = async (match: MatchRow) => {
    setDeleteTarget(match);
    setDeleteConfirmInput("");
    setDeletePredCount(null);
    setDeleteDialogOpen(true);

    const countResult = await list({
      table: "predictions",
      select: "id",
      filters: [{ column: "match_id", operator: "eq", value: match.id }],
      limit: 1,
    });
    setDeletePredCount(countResult.count ?? 0);
  };

  const matchSlug = deleteTarget
    ? `${deleteTarget.home_team_short_name || deleteTarget.home_team_name}-${deleteTarget.away_team_short_name || deleteTarget.away_team_name}`.toLowerCase().replace(/\s+/g, "-")
    : "";

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    const result = await remove("matches", deleteTarget.id);
    setDeleteSubmitting(false);
    if (!result.error) {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setDeleteConfirmInput("");
      fetchMatches();
    }
  };

  const handleRestoreMatch = async (id: string) => {
    const result = await restore("matches", id);
    if (!result.error) fetchMatches();
  };

  const loading = crudLoading || sofascore.loading;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brm-text-primary flex items-center gap-2">
            <Swords className="w-6 h-6 text-brm-purple" />
            Gestão de Partidas
          </h1>
          <p className="text-sm text-brm-text-secondary mt-1">{totalCount} partidas</p>
        </div>
        <Button variant="ghost" size="sm" onPress={fetchMatches} isDisabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Seções de Partidas" className="*:font-display *:font-semibold *:text-xs *:uppercase">
            <Tabs.Tab id="list">Partidas<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="import">Importar / Atualizar<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* Matches List */}
        <Tabs.Panel id="list" className="pt-4 space-y-4">
          {/* Filters */}
          <Card className="p-4 bg-brm-card border border-white/5">
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedTournamentId ?? ""}
                onChange={(e) => { setSelectedTournamentId(e.target.value || null); setPage(0); }}
                className="bg-brm-card text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary"
              >
                <option value="" className="bg-brm-card">Todos os Torneios</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id} className="bg-brm-card">{t.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Rodada"
                value={roundFilter}
                onChange={(e) => { setRoundFilter(e.target.value); setPage(0); }}
                className="w-24 bg-brm-card text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary"
              />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="bg-brm-card text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary"
              >
                <option value="" className="bg-brm-card">Todos os Status</option>
                <option value="notstarted" className="bg-brm-card">Agendado</option>
                <option value="inprogress" className="bg-brm-card">Ao Vivo</option>
                <option value="finished" className="bg-brm-card">Finalizado</option>
                <option value="postponed" className="bg-brm-card">Adiado</option>
              </select>
              <Button
                variant={showDeleted ? "danger" : "ghost"}
                size="sm"
                onPress={() => { setShowDeleted((v) => !v); setPage(0); }}
                className="text-xs gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {showDeleted ? "Excluídas (ativas)" : "Ver excluídas"}
              </Button>
            </div>
          </Card>

          {/* Matches */}
          <div className="space-y-2">
            {matches.map((match, i) => {
              const st = getStatusLabel(match.status);
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card className="p-3 bg-brm-card border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      {/* Round & Status */}
                      <div className="hidden sm:flex flex-col items-center gap-1 w-20 shrink-0">
                        <span className="text-[10px] font-semibold text-brm-text-muted uppercase text-center">
                          {match.round_name || `R${match.round_number}`}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${st.class}`}>
                          {st.label}
                        </span>
                      </div>

                      {/* Home Team */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="font-display font-bold text-xs text-brm-text-primary truncate text-right">
                          {match.home_team_short_name || match.home_team_name}
                        </span>
                        <div className="relative w-7 h-7 shrink-0">
                          <Image src={match.home_team_logo || "/images/team-placeholder.svg"} alt="" fill className="object-contain" />
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-1 px-2 shrink-0">
                        <span className="font-display font-black text-lg text-brm-text-primary w-6 text-right">
                          {match.status === "notstarted" ? "-" : match.home_score}
                        </span>
                        <span className="text-brm-text-muted text-xs">×</span>
                        <span className="font-display font-black text-lg text-brm-text-primary w-6 text-left">
                          {match.status === "notstarted" ? "-" : match.away_score}
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative w-7 h-7 shrink-0">
                          <Image src={match.away_team_logo || "/images/team-placeholder.svg"} alt="" fill className="object-contain" />
                        </div>
                        <span className="font-display font-bold text-xs text-brm-text-primary truncate">
                          {match.away_team_short_name || match.away_team_name}
                        </span>
                      </div>

                      {/* Date & Actions */}
                      <div className="hidden md:block text-[10px] text-brm-text-muted shrink-0 w-28 text-right">
                        {formatDateTime(match.start_time)}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!showDeleted && (
                          <Button variant="ghost" size="sm" isIconOnly aria-label="Editar" className="w-7 h-7 min-w-7"
                            onPress={() => { setEditingMatch(match); setIsEditOpen(true); }}>
                            <Edit className="w-3.5 h-3.5 text-brm-primary" />
                          </Button>
                        )}
                        {showDeleted ? (
                          <Button variant="ghost" size="sm" isIconOnly aria-label="Restaurar" className="w-7 h-7 min-w-7"
                            onPress={() => handleRestoreMatch(match.id)}>
                            <Undo2 className="w-3.5 h-3.5 text-brm-secondary" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" isIconOnly aria-label="Excluir" className="w-7 h-7 min-w-7"
                            onPress={() => openDeleteDialog(match)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Mobile meta */}
                    <div className="flex sm:hidden items-center gap-2 mt-2 text-[10px] text-brm-text-muted">
                      <span>{match.round_name || `R${match.round_number}`}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${st.class}`}>{st.label}</span>
                      <span>{formatDateTime(match.start_time)}</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {matches.length === 0 && !loading && (
              <Card className="p-8 bg-brm-card border border-white/5 text-center">
                <p className="text-sm text-brm-text-muted">Nenhuma partida encontrada</p>
              </Card>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-brm-text-muted">Página {page + 1} de {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" isDisabled={page === 0} onPress={() => setPage(p => p - 1)} className="text-xs">Anterior</Button>
                <Button variant="ghost" size="sm" isDisabled={page >= totalPages - 1} onPress={() => setPage(p => p + 1)} className="text-xs">Próxima</Button>
              </div>
            </div>
          )}
        </Tabs.Panel>

        {/* Import / Update */}
        <Tabs.Panel id="import" className="pt-4">
          <Card className="p-5 bg-brm-card border border-white/5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wide text-brm-text-primary mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-brm-primary" />
              Importar / Atualizar Partidas do SofaScore
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">Torneio</label>
                <select
                  value={importTournamentId}
                  onChange={(e) => {
                    setImportTournamentId(e.target.value);
                    setImportSeasonId("");
                  }}
                  className="w-full bg-brm-card text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary"
                >
                  <option value="" className="bg-brm-card">Selecionar...</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id} className="bg-brm-card">
                      {t.name} {t.sofascore_id ? `(SofaScore: ${t.sofascore_id})` : "(Sem ID SofaScore)"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">Temporada</label>
                <select
                  value={importSeasonId}
                  onChange={(e) => setImportSeasonId(e.target.value)}
                  disabled={!importTournamentId || seasons.length === 0}
                  className="w-full bg-brm-card text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary disabled:opacity-50"
                >
                  <option value="" className="bg-brm-card">Selecionar...</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id} className="bg-brm-card">
                      {s.year} {s.is_current ? "(Atual)" : ""} {s.sofascore_season_id ? `- SofaScore: ${s.sofascore_season_id}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">Rodada (opcional)</label>
                <input
                  type="number"
                  value={importRound}
                  onChange={(e) => setImportRound(e.target.value)}
                  placeholder="Ex: 1"
                  className="w-full bg-brm-card text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary"
                />
              </div>
            </div>

            {importStatus && (
              <div className="mb-4 p-3 rounded-lg bg-brm-primary/10 text-brm-primary text-xs font-semibold">
                {importStatus}
              </div>
            )}

            {sofascore.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold">
                {sofascore.error}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onPress={handleImportMatches}
                isDisabled={loading || !importTournamentId || !importSeasonId}
                className="bg-brm-secondary text-brm-secondary-foreground text-xs gap-1"
              >
                <Download className="w-4 h-4" />
                Importar Todas
              </Button>
              <Button
                onPress={handleImportRound}
                isDisabled={loading || !importTournamentId || !importSeasonId || !importRound}
                className="bg-brm-purple text-white text-xs gap-1"
              >
                <Target className="w-4 h-4" />
                Importar Rodada
              </Button>
              <Button
                onPress={handleUpdateScores}
                isDisabled={loading || !importTournamentId || !importSeasonId}
                className="bg-brm-primary text-brm-primary-foreground text-xs gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Atualizar Placares
              </Button>
              <Button
                onPress={handleCalculateScores}
                isDisabled={loading || !importTournamentId}
                className="bg-brm-accent text-white text-xs gap-1"
              >
                <Calculator className="w-4 h-4" />
                Calcular Pontuação
              </Button>
            </div>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog.Backdrop isOpen={deleteDialogOpen} onOpenChange={(o) => { if (!deleteSubmitting) setDeleteDialogOpen(o); }}>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[480px] bg-brm-card border border-white/10">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading className="font-display font-bold text-brm-text-primary">
                Excluir partida?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              {deleteTarget && (
                <div className="space-y-3 text-sm">
                  <p className="text-brm-text-secondary">
                    <strong className="text-brm-text-primary">
                      {deleteTarget.home_team_name} vs {deleteTarget.away_team_name}
                    </strong>{" "}
                    — Rodada {deleteTarget.round_number}
                  </p>
                  {deletePredCount === null ? (
                    <p className="text-brm-text-muted text-xs">Verificando palpites…</p>
                  ) : deletePredCount > 0 ? (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-300">
                      <p className="font-semibold mb-1">
                        {deletePredCount} palpite{deletePredCount === 1 ? "" : "s"} associado{deletePredCount === 1 ? "" : "s"}.
                      </p>
                      <p className="text-xs">
                        A partida será marcada como excluída (soft-delete). Os palpites ficam preservados e não aparecem mais para os usuários. Você pode restaurar depois pelo filtro &ldquo;Ver excluídas&rdquo;.
                      </p>
                    </div>
                  ) : (
                    <p className="text-brm-text-muted text-xs">Sem palpites — nenhum dado de usuário afetado.</p>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">
                      Digite <code className="text-brm-secondary">{matchSlug}</code> para confirmar
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      placeholder={matchSlug}
                      autoComplete="off"
                      className="w-full bg-brm-background text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-red-500"
                    />
                  </div>
                </div>
              )}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary" isDisabled={deleteSubmitting}>Cancelar</Button>
              <Button
                variant="danger"
                isDisabled={
                  deleteSubmitting ||
                  deletePredCount === null ||
                  deleteConfirmInput.trim().toLowerCase() !== matchSlug
                }
                onPress={confirmDelete}
              >
                {deleteSubmitting ? "Excluindo…" : "Excluir"}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>

      {/* Edit Modal */}
      {editingMatch && (
        <Modal>
          <Modal.Backdrop isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[440px] bg-brm-card border border-white/10">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading className="font-display font-bold text-brm-text-primary">
                    Editar Partida
                  </Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleEditMatch}>
                  <Modal.Body>
                    <div className="text-center mb-4">
                      <p className="font-display font-bold text-sm text-brm-text-primary">
                        {editingMatch.home_team_name} vs {editingMatch.away_team_name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-4">
                      <TextField name="round_number" defaultValue={String(editingMatch.round_number)}>
                        <Label>Rodada</Label>
                        <Input variant="secondary" type="number" />
                      </TextField>
                      <div>
                        <label className="text-xs font-medium text-brm-text-secondary block mb-1">Status</label>
                        <select name="status" defaultValue={editingMatch.status}
                          className="w-full bg-brm-card text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary">
                          <option value="notstarted" className="bg-brm-card">Agendado</option>
                          <option value="inprogress" className="bg-brm-card">Ao Vivo</option>
                          <option value="finished" className="bg-brm-card">Finalizado</option>
                          <option value="postponed" className="bg-brm-card">Adiado</option>
                          <option value="canceled" className="bg-brm-card">Cancelado</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <TextField name="home_score" defaultValue={String(editingMatch.home_score)}>
                          <Label>Gols Casa</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
                        <TextField name="away_score" defaultValue={String(editingMatch.away_score)}>
                          <Label>Gols Fora</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-brm-text-secondary block mb-1">Data/Hora</label>
                        <input
                          type="datetime-local"
                          name="start_time"
                          defaultValue={editingMatch.start_time ? (() => {
                            const d = new Date(editingMatch.start_time);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, "0");
                            const day = String(d.getDate()).padStart(2, "0");
                            const hours = String(d.getHours()).padStart(2, "0");
                            const minutes = String(d.getMinutes()).padStart(2, "0");
                            return `${year}-${month}-${day}T${hours}:${minutes}`;
                          })() : ""}
                          className="w-full bg-brm-card text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary"
                        />
                      </div>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="ghost" slot="close" className="mr-2">Cancelar</Button>
                    <Button type="submit" className="bg-brm-primary text-brm-primary-foreground">Salvar</Button>
                  </Modal.Footer>
                </form>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      )}
    </div>
  );
}
