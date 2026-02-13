"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Button, Modal, TextField, Input, Label, Tabs } from "@heroui/react";
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
} from "lucide-react";
import Image from "next/image";

import { useAdminCrud, useSofascoreApi } from "@/hooks/use-admin-crud";

interface MatchRow {
  id: number;
  round_number: number;
  round_name: string | null;
  round_type: string | null;
  cup_round_type: number | null;
  group_name: string | null;
  home_team_id: number;
  home_team_name: string;
  home_team_short_name: string | null;
  home_team_logo: string | null;
  away_team_id: number;
  away_team_name: string;
  away_team_short_name: string | null;
  away_team_logo: string | null;
  start_time: string;
  status: string;
  home_score: number;
  away_score: number;
  tournament_id: number;
  tournament_name: string;
  season_id: number | null;
}

interface TournamentOption {
  id: number;
  name: string;
  format: string | null;
  season_id: number | null;
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
  const { list, update, remove, loading: crudLoading } = useAdminCrud();
  const sofascore = useSofascoreApi();

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [roundFilter, setRoundFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const [importTournamentId, setImportTournamentId] = useState("");
  const [importSeasonId, setImportSeasonId] = useState("");
  const [importRound, setImportRound] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const [editingMatch, setEditingMatch] = useState<MatchRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchTournaments = useCallback(async () => {
    const result = await list<TournamentOption>({
      table: "tournaments",
      select: "id, name, format, season_id",
      orderBy: { column: "display_order", ascending: true },
      limit: 50,
    });
    if (result.data) setTournaments(result.data as TournamentOption[]);
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

    const result = await list<MatchRow>({
      table: "matches",
      filters,
      orderBy: { column: "start_time", ascending: false },
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });

    if (result.data) {
      setMatches(result.data as MatchRow[]);
      setTotalCount(result.count ?? 0);
    }
  }, [list, selectedTournamentId, roundFilter, statusFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTournaments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMatches();
  }, [selectedTournamentId, roundFilter, statusFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImportMatches = async () => {
    if (!importTournamentId || !importSeasonId) return;
    setImportStatus("Importando todas as partidas (passadas + futuras, pode demorar)...");
    const result = await sofascore.call<{ count: number; pastCount: number; futureCount: number; groups: string[]; roundNames: string[]; roundNumbers: number[] }>({
      action: "import_matches",
      tournamentId: Number(importTournamentId),
      seasonId: Number(importSeasonId),
    });
    if (result) {
      const info = [`${result.count} partidas importadas (${result.pastCount} passadas, ${result.futureCount} futuras)`];
      if (result.roundNumbers?.length) info.push(`Rodadas: ${result.roundNumbers[0]}-${result.roundNumbers[result.roundNumbers.length - 1]}`);
      if (result.groups?.length) info.push(`Grupos: ${result.groups.join(", ")}`);
      setImportStatus(info.join(" | "));
      fetchMatches();
      setTimeout(() => setImportStatus(null), 8000);
    } else {
      setImportStatus("Erro ao importar");
    }
  };

  const handleImportRound = async () => {
    if (!importTournamentId || !importSeasonId || !importRound) return;
    setImportStatus(`Importando rodada ${importRound}...`);
    const result = await sofascore.call<{ count: number; round: number; statuses: string[] }>({
      action: "import_round_matches",
      tournamentId: Number(importTournamentId),
      seasonId: Number(importSeasonId),
      round: Number(importRound),
    });
    if (result) {
      setImportStatus(`Rodada ${result.round}: ${result.count} partidas importadas (${result.statuses.join(", ")})`);
      fetchMatches();
      setTimeout(() => setImportStatus(null), 5000);
    } else {
      setImportStatus("Erro ao importar rodada");
    }
  };

  const handleUpdateScores = async () => {
    if (!importTournamentId || !importSeasonId) return;
    setImportStatus("Atualizando placares do SofaScore...");
    const result = await sofascore.call<{ updated: number; total: number }>({
      action: "update_match_scores",
      tournamentId: Number(importTournamentId),
      seasonId: Number(importSeasonId),
    });
    if (result) {
      setImportStatus(`${result.updated}/${result.total} placares atualizados!`);
      fetchMatches();
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleCalculateScores = async () => {
    if (!importTournamentId) return;
    setImportStatus("Calculando pontuação dos palpites...");
    const result = await sofascore.call<{ scored: number; totalPredictions: number; matchesProcessed: number }>({
      action: "calculate_scores",
      tournamentId: Number(importTournamentId),
      seasonId: importSeasonId ? Number(importSeasonId) : undefined,
      round: importRound ? Number(importRound) : undefined,
    });
    if (result) {
      setImportStatus(`${result.scored} palpites pontuados de ${result.totalPredictions} total (${result.matchesProcessed} partidas processadas)`);
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const handleEditMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMatch) return;
    const fd = new FormData(e.currentTarget);
    await update("matches", editingMatch.id, {
      round_number: Number(fd.get("round_number")),
      status: fd.get("status") as string,
      home_score: Number(fd.get("home_score")),
      away_score: Number(fd.get("away_score")),
      start_time: fd.get("start_time") as string,
    });
    setIsEditOpen(false);
    setEditingMatch(null);
    fetchMatches();
  };

  const handleDeleteMatch = async (id: number) => {
    if (!confirm("Excluir esta partida?")) return;
    await remove("matches", id);
    fetchMatches();
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
                onChange={(e) => { setSelectedTournamentId(e.target.value ? Number(e.target.value) : null); setPage(0); }}
                className="bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
              >
                <option value="">Todos os Torneios</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Rodada"
                value={roundFilter}
                onChange={(e) => { setRoundFilter(e.target.value); setPage(0); }}
                className="w-24 bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
              />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
              >
                <option value="">Todos os Status</option>
                <option value="notstarted">Agendado</option>
                <option value="inprogress">Ao Vivo</option>
                <option value="finished">Finalizado</option>
                <option value="postponed">Adiado</option>
              </select>
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
                          {match.round_name || (match.group_name ? `${match.group_name} R${match.round_number}` : `R${match.round_number}`)}
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
                          <Image src={match.home_team_logo || `/api/team-logo/${match.home_team_id}`} alt="" fill className="object-contain" />
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
                          <Image src={match.away_team_logo || `/api/team-logo/${match.away_team_id}`} alt="" fill className="object-contain" />
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
                        <Button variant="ghost" size="sm" isIconOnly aria-label="Editar" className="w-7 h-7 min-w-7"
                          onPress={() => { setEditingMatch(match); setIsEditOpen(true); }}>
                          <Edit className="w-3.5 h-3.5 text-brm-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" isIconOnly aria-label="Excluir" className="w-7 h-7 min-w-7"
                          onPress={() => handleDeleteMatch(match.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile meta */}
                    <div className="flex sm:hidden items-center gap-2 mt-2 text-[10px] text-brm-text-muted">
                      <span>{match.round_name || (match.group_name ? `${match.group_name} R${match.round_number}` : `R${match.round_number}`)}</span>
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
                    const t = tournaments.find(t => t.id === Number(e.target.value));
                    if (t?.season_id) setImportSeasonId(String(t.season_id));
                  }}
                  className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
                >
                  <option value="">Selecionar...</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (ID: {t.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">Season ID</label>
                <input
                  type="number"
                  value={importSeasonId}
                  onChange={(e) => setImportSeasonId(e.target.value)}
                  placeholder="Ex: 72034"
                  className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">Rodada (opcional)</label>
                <input
                  type="number"
                  value={importRound}
                  onChange={(e) => setImportRound(e.target.value)}
                  placeholder="Ex: 1"
                  className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
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
                      <TextField name="status" defaultValue={editingMatch.status}>
                        <Label>Status</Label>
                        <Input variant="secondary" />
                      </TextField>
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
                      <TextField name="start_time" defaultValue={editingMatch.start_time}>
                        <Label>Data/Hora (ISO)</Label>
                        <Input variant="secondary" />
                      </TextField>
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
