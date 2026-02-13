"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, Modal, TextField, Input, Label, Tabs } from "@heroui/react";
import { BarChart3, RefreshCw, Edit, Trophy, Target, Award, Calculator, Filter } from "lucide-react";

import { useAdminCrud, useSofascoreApi } from "@/hooks/use-admin-crud";

interface TournamentOption {
  id: number;
  name: string;
  format: string | null;
  season_id: number | null;
}

interface UserPointsRow {
  id: string;
  user_id: string;
  tournament_id: number;
  season_id: number | null;
  points: number;
  predictions_count: number;
  exact_scores: number;
  correct_results: number;
}

interface UserProfileRow {
  id: string;
  firebase_id: string;
  name: string;
  points: number | null;
  predictions_count: number | null;
  xp: number | null;
  level: number | null;
}

interface RoundScoreRow {
  user_id: string;
  userName: string;
  round_number: number;
  points: number;
  predictions: number;
  exactScores: number;
  correctResults: number;
}

export default function ScoringManagementPage() {
  const { list, update, loading } = useAdminCrud();
  const sofascore = useSofascoreApi();

  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [userPoints, setUserPoints] = useState<UserPointsRow[]>([]);
  const [users, setUsers] = useState<UserProfileRow[]>([]);
  const [roundScores, setRoundScores] = useState<RoundScoreRow[]>([]);

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [roundFilter, setRoundFilter] = useState<string>("");
  const [calcStatus, setCalcStatus] = useState<string | null>(null);

  const [editingUserPoints, setEditingUserPoints] = useState<UserPointsRow | null>(null);
  const [isPointsEditOpen, setIsPointsEditOpen] = useState(false);

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
      select: "id, firebase_id, name, points, predictions_count, xp, level",
      orderBy: { column: "points", ascending: false },
      limit: 50,
    });
    if (result.data) setUsers(result.data as UserProfileRow[]);
  }, [list]);

  const fetchUserPoints = useCallback(async () => {
    const filters: { column: string; operator: string; value: unknown }[] = [];
    if (selectedTournamentId) {
      filters.push({ column: "tournament_id", operator: "eq", value: Number(selectedTournamentId) });
    }
    const result = await list<UserPointsRow>({
      table: "user_tournament_points",
      filters,
      orderBy: { column: "points", ascending: false },
      limit: 100,
    });
    if (result.data) setUserPoints(result.data as UserPointsRow[]);
  }, [list, selectedTournamentId]);

  const fetchRoundScores = useCallback(async () => {
    if (!selectedTournamentId) { setRoundScores([]); return; }

    const tId = Number(selectedTournamentId);
    const tournament = tournaments.find((t) => t.id === tId);
    const seasonId = tournament?.season_id;

    interface PredJoin {
      user_id: string;
      points_earned: number | null;
      is_correct: boolean | null;
      is_exact_score: boolean | null;
      match_id: number;
    }

    const predFilters: { column: string; operator: string; value: unknown }[] = [
      { column: "tournament_id", operator: "eq", value: tId },
    ];
    if (seasonId) predFilters.push({ column: "season_id", operator: "eq", value: seasonId });

    const predResult = await list<PredJoin>({
      table: "predictions",
      select: "user_id, points_earned, is_correct, is_exact_score, match_id",
      filters: predFilters,
      limit: 5000,
    });

    if (!predResult.data || predResult.data.length === 0) { setRoundScores([]); return; }

    interface MatchRound { id: number; round_number: number }
    const matchResult = await list<MatchRound>({
      table: "matches",
      select: "id, round_number",
      filters: [{ column: "tournament_id", operator: "eq", value: tId }],
      limit: 5000,
    });

    const matchRoundMap = new Map<number, number>();
    if (matchResult.data) {
      for (const m of matchResult.data as MatchRound[]) {
        matchRoundMap.set(m.id, m.round_number);
      }
    }

    const scoreMap = new Map<string, RoundScoreRow>();
    for (const pred of predResult.data as PredJoin[]) {
      const roundNum = matchRoundMap.get(pred.match_id) ?? 0;
      if (roundFilter && roundNum !== Number(roundFilter)) continue;

      const key = `${pred.user_id}-${roundNum}`;
      if (!scoreMap.has(key)) {
        scoreMap.set(key, {
          user_id: pred.user_id,
          userName: "",
          round_number: roundNum,
          points: 0,
          predictions: 0,
          exactScores: 0,
          correctResults: 0,
        });
      }
      const entry = scoreMap.get(key)!;
      entry.points += pred.points_earned || 0;
      entry.predictions += 1;
      if (pred.is_exact_score) entry.exactScores += 1;
      if (pred.is_correct) entry.correctResults += 1;
    }

    const rows = Array.from(scoreMap.values());
    for (const row of rows) {
      const user = users.find((u) => u.id === row.user_id || u.firebase_id === row.user_id);
      row.userName = user?.name || row.user_id.slice(0, 8);
    }
    rows.sort((a, b) => a.round_number - b.round_number || b.points - a.points);
    setRoundScores(rows);
  }, [list, selectedTournamentId, roundFilter, tournaments, users]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTournaments();
    void fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUserPoints();
    void fetchRoundScores();
  }, [selectedTournamentId, roundFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId || u.firebase_id === userId);
    return user?.name || userId.slice(0, 8);
  };

  const handleUpdateUserPoints = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUserPoints) return;
    const fd = new FormData(e.currentTarget);
    await update("user_tournament_points", editingUserPoints.id, {
      points: Number(fd.get("points")),
      predictions_count: Number(fd.get("predictions_count")),
      exact_scores: Number(fd.get("exact_scores")),
      correct_results: Number(fd.get("correct_results")),
    });
    setIsPointsEditOpen(false);
    setEditingUserPoints(null);
    fetchUserPoints();
  };

  const handleCalculateScores = async () => {
    if (!selectedTournamentId) return;
    const tournament = tournaments.find((t) => t.id === Number(selectedTournamentId));
    setCalcStatus("Calculando pontuação dos palpites...");
    const result = await sofascore.call<{ scored: number; totalPredictions: number; matchesProcessed: number }>({
      action: "calculate_scores",
      tournamentId: Number(selectedTournamentId),
      seasonId: tournament?.season_id || undefined,
      round: roundFilter ? Number(roundFilter) : undefined,
    });
    if (result) {
      setCalcStatus(`${result.scored} palpites pontuados de ${result.totalPredictions} total (${result.matchesProcessed} partidas)`);
      fetchUserPoints();
      fetchRoundScores();
      setTimeout(() => setCalcStatus(null), 5000);
    } else {
      setCalcStatus("Erro ao calcular pontuação");
    }
  };

  const overallRanking = users
    .filter((u) => (u.points ?? 0) > 0 || (u.predictions_count ?? 0) > 0)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  const roundGroups = (() => {
    const groups = new Map<number, RoundScoreRow[]>();
    for (const row of roundScores) {
      if (!groups.has(row.round_number)) groups.set(row.round_number, []);
      groups.get(row.round_number)!.push(row);
    }
    const sorted = Array.from(groups.entries()).sort(([a], [b]) => a - b);
    return sorted.map(([round, rows]) => ({
      round,
      rows: rows.sort((a, b) => b.points - a.points),
      totalPoints: rows.reduce((s, r) => s + r.points, 0),
    }));
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brm-text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Gestão de Pontuação
          </h1>
          <p className="text-sm text-brm-text-secondary mt-1">Ranking geral, por torneio e por rodada</p>
        </div>
        <Button variant="ghost" size="sm" onPress={() => { fetchUserPoints(); fetchRoundScores(); }} isDisabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-brm-card border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-brm-secondary" />
            <h3 className="font-display font-bold text-xs uppercase text-brm-text-muted">Ranking Geral</h3>
          </div>
          <p className="font-display font-black text-2xl text-brm-text-primary">{overallRanking.length}</p>
          <p className="text-[10px] text-brm-text-muted">usuários com pontuação</p>
        </Card>
        <Card className="p-4 bg-brm-card border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-brm-primary" />
            <h3 className="font-display font-bold text-xs uppercase text-brm-text-muted">Por Torneio</h3>
          </div>
          <p className="font-display font-black text-2xl text-brm-text-primary">{userPoints.length}</p>
          <p className="text-[10px] text-brm-text-muted">registros de pontuação</p>
        </Card>
        <Card className="p-4 bg-brm-card border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-brm-accent" />
            <h3 className="font-display font-bold text-xs uppercase text-brm-text-muted">Por Rodada</h3>
          </div>
          <p className="font-display font-black text-2xl text-brm-text-primary">{roundGroups.length}</p>
          <p className="text-[10px] text-brm-text-muted">rodadas com palpites</p>
        </Card>
      </div>

      {/* Filters + Calculate */}
      <Card className="p-4 bg-brm-card border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-brm-primary" />
          <span className="font-display font-bold text-xs uppercase text-brm-text-muted">Filtros e Ações</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">Torneio</label>
            <select
              value={selectedTournamentId}
              onChange={(e) => { setSelectedTournamentId(e.target.value); setRoundFilter(""); }}
              className="bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
            >
              <option value="">Todos</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brm-text-muted uppercase mb-1">Rodada</label>
            <input
              type="number"
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              placeholder="Todas"
              className="w-20 bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
            />
          </div>
          <Button
            onPress={handleCalculateScores}
            isDisabled={loading || !selectedTournamentId}
            className="bg-brm-accent text-white text-xs gap-1"
          >
            <Calculator className="w-4 h-4" />
            Calcular Pontuação
          </Button>
        </div>
        {calcStatus && (
          <div className="mt-3 p-3 rounded-lg bg-brm-primary/10 text-brm-primary text-xs font-semibold">
            {calcStatus}
          </div>
        )}
      </Card>

      {/* Tabs: Overall / Per Tournament / Per Round */}
      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Visualização" className="*:font-display *:font-semibold *:text-xs *:uppercase">
            <Tabs.Tab id="overall">Geral<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="tournament">Por Torneio<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="round">Por Rodada<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* Overall Ranking */}
        <Tabs.Panel id="overall" className="pt-4">
          <Card className="bg-brm-card border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-brm-text-primary">
                Ranking Geral
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase w-10">#</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Usuário</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Pontos</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-brm-text-muted uppercase hidden sm:table-cell">Palpites</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-brm-text-muted uppercase hidden sm:table-cell">XP</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-brm-text-muted uppercase hidden sm:table-cell">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {overallRanking.map((user, i) => (
                    <tr key={user.firebase_id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="py-2 px-3 text-center">
                        <span className={`font-display font-black text-sm ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-brm-text-muted"}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-brm-text-primary">{user.name}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-brm-secondary">{user.points ?? 0}</td>
                      <td className="py-2 px-3 text-right font-mono text-brm-text-secondary hidden sm:table-cell">{user.predictions_count ?? 0}</td>
                      <td className="py-2 px-3 text-right font-mono text-brm-text-secondary hidden sm:table-cell">{user.xp ?? 0}</td>
                      <td className="py-2 px-3 text-right font-mono text-brm-text-secondary hidden sm:table-cell">{user.level ?? 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Tabs.Panel>

        {/* Per Tournament */}
        <Tabs.Panel id="tournament" className="pt-4">
          <Card className="bg-brm-card border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-brm-text-primary">
                Pontuação por Torneio {selectedTournamentId && `(${tournaments.find(t => t.id === Number(selectedTournamentId))?.name || selectedTournamentId})`}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase w-10">#</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Usuário</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Torneio</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Pontos</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-brm-text-muted uppercase hidden sm:table-cell">Palpites</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-brm-text-muted uppercase hidden sm:table-cell">Exatos</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-brm-text-muted uppercase hidden sm:table-cell">Corretos</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-brm-text-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {userPoints.map((up, i) => (
                    <tr key={up.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="py-2 px-3 text-center font-display font-black text-sm text-brm-text-muted">{i + 1}</td>
                      <td className="py-2 px-3 font-semibold text-brm-text-primary">{getUserName(up.user_id)}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-brm-text-secondary">
                          {tournaments.find(t => t.id === up.tournament_id)?.name || up.tournament_id}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-brm-secondary">{up.points}</td>
                      <td className="py-2 px-3 text-right font-mono text-brm-text-secondary hidden sm:table-cell">{up.predictions_count}</td>
                      <td className="py-2 px-3 text-right font-mono text-green-400 hidden sm:table-cell">{up.exact_scores}</td>
                      <td className="py-2 px-3 text-right font-mono text-blue-400 hidden sm:table-cell">{up.correct_results}</td>
                      <td className="py-2 px-3 text-center">
                        <Button variant="ghost" size="sm" isIconOnly aria-label="Editar" className="w-7 h-7 min-w-7"
                          onPress={() => { setEditingUserPoints(up); setIsPointsEditOpen(true); }}>
                          <Edit className="w-3.5 h-3.5 text-brm-primary" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {userPoints.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-sm text-brm-text-muted">Nenhum registro encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </Tabs.Panel>

        {/* Per Round */}
        <Tabs.Panel id="round" className="pt-4 space-y-4">
          {!selectedTournamentId && (
            <Card className="p-8 bg-brm-card border border-white/5 text-center">
              <p className="text-sm text-brm-text-muted">Selecione um torneio nos filtros acima para ver a pontuação por rodada</p>
            </Card>
          )}

          {selectedTournamentId && roundGroups.length === 0 && (
            <Card className="p-8 bg-brm-card border border-white/5 text-center">
              <p className="text-sm text-brm-text-muted">Nenhum palpite pontuado encontrado</p>
            </Card>
          )}

          {roundGroups.map((group) => (
            <Card key={group.round} className="bg-brm-card border border-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brm-primary/15 flex items-center justify-center">
                    <span className="font-display font-black text-sm text-brm-primary">{group.round}</span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-brm-text-primary">Rodada {group.round}</h4>
                    <p className="text-[10px] text-brm-text-muted">{group.rows.length} usuários • {group.totalPoints} pts total</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2">
                      <th className="text-center py-2 px-3 font-semibold text-brm-text-muted uppercase w-10">#</th>
                      <th className="text-left py-2 px-3 font-semibold text-brm-text-muted uppercase">Usuário</th>
                      <th className="text-right py-2 px-3 font-semibold text-brm-text-muted uppercase">Pontos</th>
                      <th className="text-right py-2 px-3 font-semibold text-brm-text-muted uppercase">Palpites</th>
                      <th className="text-right py-2 px-3 font-semibold text-brm-text-muted uppercase hidden sm:table-cell">Exatos</th>
                      <th className="text-right py-2 px-3 font-semibold text-brm-text-muted uppercase hidden sm:table-cell">Corretos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, i) => (
                      <tr key={`${row.user_id}-${row.round_number}`} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                        <td className="py-2 px-3 text-center">
                          <span className={`font-display font-black text-sm ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-brm-text-muted"}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-brm-text-primary">{row.userName}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-brm-secondary">{row.points}</td>
                        <td className="py-2 px-3 text-right font-mono text-brm-text-secondary">{row.predictions}</td>
                        <td className="py-2 px-3 text-right font-mono text-green-400 hidden sm:table-cell">{row.exactScores}</td>
                        <td className="py-2 px-3 text-right font-mono text-blue-400 hidden sm:table-cell">{row.correctResults}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </Tabs.Panel>
      </Tabs>

      {/* Edit User Points Modal */}
      {editingUserPoints && (
        <Modal>
          <Modal.Backdrop isOpen={isPointsEditOpen} onOpenChange={setIsPointsEditOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[400px] bg-brm-card border border-white/10">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading className="font-display font-bold text-brm-text-primary">Editar Pontuação</Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleUpdateUserPoints}>
                  <Modal.Body>
                    <div className="flex flex-col gap-4">
                      <TextField name="points" defaultValue={String(editingUserPoints.points)}>
                        <Label>Pontos</Label>
                        <Input variant="secondary" type="number" />
                      </TextField>
                      <TextField name="predictions_count" defaultValue={String(editingUserPoints.predictions_count)}>
                        <Label>Palpites</Label>
                        <Input variant="secondary" type="number" />
                      </TextField>
                      <div className="grid grid-cols-2 gap-4">
                        <TextField name="exact_scores" defaultValue={String(editingUserPoints.exact_scores)}>
                          <Label>Placares Exatos</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
                        <TextField name="correct_results" defaultValue={String(editingUserPoints.correct_results)}>
                          <Label>Resultados Corretos</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
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
