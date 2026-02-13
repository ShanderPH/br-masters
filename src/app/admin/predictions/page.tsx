"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Button, Modal, TextField, Input, Label, Tabs } from "@heroui/react";
import {
  ClipboardList,
  RefreshCw,
  Edit,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";

import { useAdminCrud } from "@/hooks/use-admin-crud";

interface TournamentOption {
  id: number;
  name: string;
  format: string | null;
  season_id: number | null;
}

interface PredictionRow {
  id: string;
  user_id: string;
  match_id: number;
  home_team_goals: number;
  away_team_goals: number;
  winner_team: string;
  points_earned: number | null;
  is_correct: boolean | null;
  is_exact_score: boolean | null;
  tournament_id: number | null;
  season_id: number | null;
  predicted_at: string;
}

interface MatchInfo {
  id: number;
  round_number: number;
  round_name: string | null;
  group_name: string | null;
  home_team_name: string;
  home_team_short_name: string | null;
  home_team_logo: string | null;
  away_team_name: string;
  away_team_short_name: string | null;
  away_team_logo: string | null;
  home_score: number;
  away_score: number;
  status: string;
  start_time: string;
  tournament_id: number;
  season_id: number | null;
}

interface UserProfileRow {
  id: string;
  firebase_id: string;
  name: string;
}

interface RoundGroup {
  round: number;
  roundName: string | null;
  groupName: string | null;
  predictions: (PredictionRow & { match?: MatchInfo; userName?: string })[];
  totalPoints: number;
  exactScores: number;
  correctResults: number;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function PredictionsManagementPage() {
  const { list, update, loading } = useAdminCrud();

  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [users, setUsers] = useState<UserProfileRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [roundFilter, setRoundFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  const [editingPrediction, setEditingPrediction] = useState<PredictionRow | null>(null);
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

  const fetchUsers = useCallback(async () => {
    const result = await list<UserProfileRow>({
      table: "users_profiles",
      select: "id, firebase_id, name",
      limit: 100,
    });
    if (result.data) setUsers(result.data as UserProfileRow[]);
  }, [list]);

  const fetchPredictions = useCallback(async () => {
    const filters: { column: string; operator: string; value: unknown }[] = [];

    if (selectedTournamentId) {
      filters.push({ column: "tournament_id", operator: "eq", value: selectedTournamentId });
    }
    if (userFilter) {
      filters.push({ column: "user_id", operator: "eq", value: userFilter });
    }

    const result = await list<PredictionRow>({
      table: "predictions",
      filters,
      orderBy: { column: "predicted_at", ascending: false },
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });

    if (result.data) {
      setPredictions(result.data as PredictionRow[]);
      setTotalCount(result.count ?? 0);

      const matchIds = [...new Set((result.data as PredictionRow[]).map((p) => p.match_id))];
      if (matchIds.length > 0) {
        const matchResult = await list<MatchInfo>({
          table: "matches",
          filters: [{ column: "id", operator: "in", value: matchIds }],
          limit: matchIds.length,
        });
        if (matchResult.data) setMatches(matchResult.data as MatchInfo[]);
      }
    }
  }, [list, selectedTournamentId, userFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTournaments();
    void fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPredictions();
  }, [selectedTournamentId, userFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId || u.firebase_id === userId);
    return user?.name || userId.slice(0, 8);
  };

  const matchMap = new Map(matches.map((m) => [m.id, m]));

  const roundGroups: RoundGroup[] = (() => {
    const groups = new Map<number, RoundGroup>();

    for (const pred of predictions) {
      const match = matchMap.get(pred.match_id);
      const roundNum = match?.round_number ?? 0;

      if (roundFilter && roundNum !== Number(roundFilter)) continue;

      if (!groups.has(roundNum)) {
        groups.set(roundNum, {
          round: roundNum,
          roundName: match?.round_name || null,
          groupName: match?.group_name || null,
          predictions: [],
          totalPoints: 0,
          exactScores: 0,
          correctResults: 0,
        });
      }

      const group = groups.get(roundNum)!;
      group.predictions.push({ ...pred, match, userName: getUserName(pred.user_id) });
      group.totalPoints += pred.points_earned || 0;
      if (pred.is_exact_score) group.exactScores++;
      if (pred.is_correct) group.correctResults++;
    }

    return Array.from(groups.values()).sort((a, b) => a.round - b.round);
  })();

  const toggleRound = (round: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  };

  const handleUpdatePrediction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPrediction) return;
    const fd = new FormData(e.currentTarget);
    await update("predictions", editingPrediction.id, {
      points_earned: Number(fd.get("points_earned")),
      is_correct: fd.get("is_correct") === "true",
      is_exact_score: fd.get("is_exact_score") === "true",
    });
    setIsEditOpen(false);
    setEditingPrediction(null);
    fetchPredictions();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brm-text-primary flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brm-accent" />
            Gestão de Palpites
          </h1>
          <p className="text-sm text-brm-text-secondary mt-1">{totalCount} palpites</p>
        </div>
        <Button variant="ghost" size="sm" onPress={fetchPredictions} isDisabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-brm-card border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-brm-primary" />
          <span className="font-display font-bold text-xs uppercase text-brm-text-muted">Filtros</span>
        </div>
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
          <select
            value={userFilter}
            onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
            className="bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
          >
            <option value="">Todos os Usuários</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Rodada"
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="w-24 bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
          />
          {selectedTournament && (
            <span className="self-center text-[10px] font-bold uppercase text-brm-text-muted bg-white/5 px-2 py-1 rounded">
              {selectedTournament.format === "league" ? "Liga" : selectedTournament.format === "knockout" ? "Mata-Mata" : selectedTournament.format === "mixed" ? "Misto" : selectedTournament.format}
              {selectedTournament.season_id && ` • Season ${selectedTournament.season_id}`}
            </span>
          )}
        </div>
      </Card>

      {/* Grouped by Round */}
      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Visualização" className="*:font-display *:font-semibold *:text-xs *:uppercase">
            <Tabs.Tab id="byRound">Por Rodada<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="flat">Lista Completa<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="byRound" className="pt-4 space-y-3">
          {roundGroups.length === 0 && !loading && (
            <Card className="p-8 bg-brm-card border border-white/5 text-center">
              <p className="text-sm text-brm-text-muted">Nenhum palpite encontrado</p>
            </Card>
          )}

          {roundGroups.map((group) => {
            const isExpanded = expandedRounds.has(group.round);
            return (
              <Card key={group.round} className="bg-brm-card border border-white/5 overflow-hidden">
                <button
                  onClick={() => toggleRound(group.round)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brm-primary/15 flex items-center justify-center shrink-0">
                      <span className="font-display font-black text-sm text-brm-primary">
                        {group.round}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-display font-bold text-sm text-brm-text-primary">
                        {group.roundName || (group.groupName ? `${group.groupName} - Rodada ${group.round}` : `Rodada ${group.round}`)}
                      </p>
                      <p className="text-[10px] text-brm-text-muted">
                        {group.predictions.length} palpites
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-brm-secondary/20 text-brm-secondary font-bold">
                        {group.totalPoints} pts
                      </span>
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">
                        {group.exactScores} exatos
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                        {group.correctResults} corretos
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-brm-text-muted" /> : <ChevronDown className="w-4 h-4 text-brm-text-muted" />}
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-white/5"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/2">
                            <th className="text-left py-2 px-3 font-semibold text-brm-text-muted uppercase">Usuário</th>
                            <th className="text-center py-2 px-3 font-semibold text-brm-text-muted uppercase">Partida</th>
                            <th className="text-center py-2 px-3 font-semibold text-brm-text-muted uppercase">Palpite</th>
                            <th className="text-center py-2 px-3 font-semibold text-brm-text-muted uppercase">Placar Real</th>
                            <th className="text-right py-2 px-3 font-semibold text-brm-text-muted uppercase">Pts</th>
                            <th className="text-center py-2 px-3 font-semibold text-brm-text-muted uppercase">Status</th>
                            <th className="text-center py-2 px-3 font-semibold text-brm-text-muted uppercase">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.predictions.map((pred) => (
                            <tr key={pred.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                              <td className="py-2 px-3 font-semibold text-brm-text-primary">{pred.userName}</td>
                              <td className="py-2 px-3 text-center">
                                {pred.match ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <div className="relative w-4 h-4 shrink-0">
                                      <Image src={pred.match.home_team_logo || `/api/team-logo/${pred.match_id}`} alt="" fill className="object-contain" />
                                    </div>
                                    <span className="text-brm-text-secondary truncate max-w-[60px]">
                                      {pred.match.home_team_short_name || pred.match.home_team_name}
                                    </span>
                                    <span className="text-brm-text-muted">×</span>
                                    <span className="text-brm-text-secondary truncate max-w-[60px]">
                                      {pred.match.away_team_short_name || pred.match.away_team_name}
                                    </span>
                                    <div className="relative w-4 h-4 shrink-0">
                                      <Image src={pred.match.away_team_logo || `/api/team-logo/${pred.match_id}`} alt="" fill className="object-contain" />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-mono text-brm-text-muted">#{pred.match_id}</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-brm-text-primary">
                                {pred.home_team_goals} × {pred.away_team_goals}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-brm-text-secondary">
                                {pred.match?.status === "finished"
                                  ? `${pred.match.home_score} × ${pred.match.away_score}`
                                  : <span className="text-brm-text-muted">-</span>
                                }
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-brm-secondary">
                                {pred.points_earned ?? 0}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {pred.is_exact_score && <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-bold">EXATO</span>}
                                {!pred.is_exact_score && pred.is_correct && <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold">CORRETO</span>}
                                {!pred.is_correct && !pred.is_exact_score && pred.match?.status === "finished" && <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold">ERRADO</span>}
                                {pred.match?.status !== "finished" && <span className="px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 text-[9px] font-bold">PENDENTE</span>}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <Button variant="ghost" size="sm" isIconOnly aria-label="Editar" className="w-7 h-7 min-w-7"
                                  onPress={() => { setEditingPrediction(pred); setIsEditOpen(true); }}>
                                  <Edit className="w-3.5 h-3.5 text-brm-primary" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </Card>
            );
          })}
        </Tabs.Panel>

        <Tabs.Panel id="flat" className="pt-4">
          <Card className="bg-brm-card border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="text-left py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Usuário</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Rodada</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Partida</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Palpite</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Pts</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase hidden sm:table-cell">Status</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Data</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred) => {
                    const match = matchMap.get(pred.match_id);
                    return (
                      <tr key={pred.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                        <td className="py-2 px-3 font-semibold text-brm-text-primary">{getUserName(pred.user_id)}</td>
                        <td className="py-2 px-3 text-center font-mono text-brm-text-secondary">
                          {match?.round_name || (match?.group_name ? `${match.group_name} R${match.round_number}` : `R${match?.round_number ?? "?"}`)}
                        </td>
                        <td className="py-2 px-3 text-center text-brm-text-secondary">
                          {match ? `${match.home_team_short_name || match.home_team_name} × ${match.away_team_short_name || match.away_team_name}` : `#${pred.match_id}`}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-brm-text-primary">
                          {pred.home_team_goals} × {pred.away_team_goals}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-brm-secondary">{pred.points_earned ?? 0}</td>
                        <td className="py-2 px-3 text-center hidden sm:table-cell">
                          {pred.is_exact_score && <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-bold">EXATO</span>}
                          {!pred.is_exact_score && pred.is_correct && <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold">CORRETO</span>}
                          {!pred.is_correct && !pred.is_exact_score && <span className="px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 text-[9px] font-bold">—</span>}
                        </td>
                        <td className="py-2 px-3 text-center text-brm-text-muted">{formatDateTime(pred.predicted_at)}</td>
                        <td className="py-2 px-3 text-center">
                          <Button variant="ghost" size="sm" isIconOnly aria-label="Editar" className="w-7 h-7 min-w-7"
                            onPress={() => { setEditingPrediction(pred); setIsEditOpen(true); }}>
                            <Edit className="w-3.5 h-3.5 text-brm-primary" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                <p className="text-xs text-brm-text-muted">Página {page + 1} de {totalPages}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" isDisabled={page === 0} onPress={() => setPage(p => p - 1)} className="text-xs">Anterior</Button>
                  <Button variant="ghost" size="sm" isDisabled={page >= totalPages - 1} onPress={() => setPage(p => p + 1)} className="text-xs">Próxima</Button>
                </div>
              </div>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Edit Prediction Modal */}
      {editingPrediction && (
        <Modal>
          <Modal.Backdrop isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[400px] bg-brm-card border border-white/10">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading className="font-display font-bold text-brm-text-primary">Editar Palpite</Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleUpdatePrediction}>
                  <Modal.Body>
                    <div className="flex flex-col gap-4">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-brm-text-muted">Palpite: {editingPrediction.home_team_goals} × {editingPrediction.away_team_goals}</p>
                        <p className="text-xs text-brm-text-muted">Match ID: {editingPrediction.match_id}</p>
                      </div>
                      <TextField name="points_earned" defaultValue={String(editingPrediction.points_earned ?? 0)}>
                        <Label>Pontos Ganhos</Label>
                        <Input variant="secondary" type="number" />
                      </TextField>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">Correto?</label>
                          <select name="is_correct" defaultValue={String(editingPrediction.is_correct ?? false)}
                            className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 border border-white/10">
                            <option value="true">Sim</option>
                            <option value="false">Não</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">Placar Exato?</label>
                          <select name="is_exact_score" defaultValue={String(editingPrediction.is_exact_score ?? false)}
                            className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 border border-white/10">
                            <option value="true">Sim</option>
                            <option value="false">Não</option>
                          </select>
                        </div>
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
