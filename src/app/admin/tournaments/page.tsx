"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Button, Modal, TextField, Input, Label, Tabs } from "@heroui/react";
import {
  Trophy,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Globe,
  Star,
  Plus,
  Layers,
  Swords,
  ListOrdered,
  Users,
} from "lucide-react";

import { useAdminCrud, useSofascoreApi } from "@/hooks/use-admin-crud";

interface TournamentRow {
  id: number;
  name: string;
  slug: string | null;
  short_name: string | null;
  country: string | null;
  format: string | null;
  has_rounds: boolean | null;
  has_groups: boolean | null;
  has_playoff_series: boolean | null;
  status: string | null;
  is_featured: boolean | null;
  display_order: number | null;
  season_id: number | null;
  current_phase: string | null;
  start_date: string | null;
  end_date: string | null;
  last_sync_at: string | null;
}

interface SeasonRow {
  id: number;
  tournament_id: number;
  name: string;
  year: string | null;
  is_current: boolean | null;
  current_round_number: number | null;
}

interface SetupResult {
  tournament: TournamentRow;
  seasons: SeasonRow[];
  rounds: { round: number; name?: string; slug?: string }[];
  currentRound: { round: number; name?: string } | null;
  detectedFormat: string;
}

const FORMAT_LABELS: Record<string, { label: string; color: string; icon: typeof Trophy }> = {
  league: { label: "Liga", color: "bg-blue-500/20 text-blue-400", icon: ListOrdered },
  knockout: { label: "Mata-Mata", color: "bg-red-500/20 text-red-400", icon: Swords },
  mixed: { label: "Misto", color: "bg-purple-500/20 text-purple-400", icon: Layers },
};

export default function TournamentsManagementPage() {
  const { list, update, remove, loading: crudLoading } = useAdminCrud();
  const sofascore = useSofascoreApi();

  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentRow | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const [setupTournamentId, setSetupTournamentId] = useState("");
  const [setupSeasonId, setSetupSeasonId] = useState("");
  const [setupFormat, setSetupFormat] = useState("");
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<TournamentRow | null>(null);

  const fetchTournaments = useCallback(async () => {
    const result = await list<TournamentRow>({
      table: "tournaments",
      orderBy: { column: "display_order", ascending: true },
      limit: 50,
    });
    if (result.data) {
      setTournaments(result.data as TournamentRow[]);
      setTotalCount(result.count ?? 0);
    }
  }, [list]);

  const fetchSeasons = useCallback(async (tournamentId: number) => {
    const result = await list<SeasonRow>({
      table: "tournament_seasons",
      filters: [{ column: "tournament_id", operator: "eq", value: tournamentId }],
      orderBy: { column: "id", ascending: false },
      limit: 20,
    });
    if (result.data) setSeasons(result.data as SeasonRow[]);
  }, [list]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTournaments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedTournament) void fetchSeasons(selectedTournament.id);
  }, [selectedTournament]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetupTournament = async () => {
    const tId = parseInt(setupTournamentId);
    const sId = parseInt(setupSeasonId);
    if (!tId || !sId) return;

    setImportStatus("Configurando torneio via SofaScore...");
    setSetupResult(null);

    const result = await sofascore.call<SetupResult>({
      action: "setup_tournament",
      tournamentId: tId,
      seasonId: sId,
      format: setupFormat || undefined,
    });

    if (result) {
      setSetupResult(result);
      setImportStatus(`Torneio "${result.tournament.name}" configurado! Formato: ${result.detectedFormat}. ${result.rounds.length} rodadas/fases encontradas.`);
      fetchTournaments();
    } else {
      setImportStatus(null);
    }
  };

  const handleImportMatches = async (tournamentId: number, seasonId: number) => {
    setImportStatus("Importando partidas do SofaScore (pode demorar)...");
    const result = await sofascore.call<{ count: number; groups: string[]; roundNames: string[] }>({
      action: "import_matches",
      tournamentId,
      seasonId,
    });
    if (result) {
      const info = [`${result.count} partidas importadas`];
      if (result.groups?.length) info.push(`Grupos: ${result.groups.join(", ")}`);
      if (result.roundNames?.length) info.push(`Fases: ${result.roundNames.join(", ")}`);
      setImportStatus(info.join(" • "));
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const handleImportTeams = async (tournamentId: number, seasonId: number) => {
    setImportStatus("Importando times...");
    const result = await sofascore.call<{ count: number }>({
      action: "import_teams",
      tournamentId,
      seasonId,
    });
    if (result) {
      setImportStatus(`${result.count} times importados!`);
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleUpdateScores = async (tournamentId: number, seasonId: number) => {
    setImportStatus("Atualizando placares...");
    const result = await sofascore.call<{ updated: number; total: number }>({
      action: "update_match_scores",
      tournamentId,
      seasonId,
    });
    if (result) {
      setImportStatus(`${result.updated}/${result.total} placares atualizados!`);
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleUpdateTournament = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTournament) return;
    const fd = new FormData(e.currentTarget);
    await update("tournaments", editingTournament.id, {
      name: fd.get("name") as string,
      short_name: fd.get("short_name") as string,
      country: fd.get("country") as string,
      format: fd.get("format") as string,
      status: fd.get("status") as string,
      display_order: Number(fd.get("display_order")),
      is_featured: fd.get("is_featured") === "on",
      season_id: Number(fd.get("season_id")) || null,
    });
    setIsEditOpen(false);
    setEditingTournament(null);
    fetchTournaments();
  };

  const handleDeleteTournament = async (id: number) => {
    if (!confirm("Excluir este torneio? Isso pode afetar partidas e pontuações relacionadas.")) return;
    await remove("tournaments", id);
    fetchTournaments();
  };

  const loading = crudLoading || sofascore.loading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brm-text-primary flex items-center gap-2">
            <Trophy className="w-6 h-6 text-brm-secondary" />
            Gestão de Torneios
          </h1>
          <p className="text-sm text-brm-text-secondary mt-1">
            {totalCount} torneios cadastrados
          </p>
        </div>
        <Button variant="ghost" size="sm" onPress={fetchTournaments} isDisabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {importStatus && (
        <Card className="p-3 bg-brm-primary/10 border border-brm-primary/20">
          <p className="text-xs font-semibold text-brm-primary">{importStatus}</p>
        </Card>
      )}

      {sofascore.error && (
        <Card className="p-3 bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-semibold text-red-400">{sofascore.error}</p>
        </Card>
      )}

      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Seções de Torneios" className="*:font-display *:font-semibold *:text-xs *:uppercase">
            <Tabs.Tab id="list">Torneios<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="add">Adicionar Torneio<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* Tournaments List */}
        <Tabs.Panel id="list" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tournaments.map((t, i) => {
              const fmt = FORMAT_LABELS[t.format || "league"] || FORMAT_LABELS.league;
              const FormatIcon = fmt.icon;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={`p-4 bg-brm-card border transition-all duration-200 cursor-pointer ${
                      selectedTournament?.id === t.id ? "border-brm-primary" : "border-white/5 hover:border-white/10"
                    }`}
                    onClick={() => setSelectedTournament(t)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-sm text-brm-text-primary truncate">{t.name}</h3>
                          {t.is_featured && <Star className="w-3.5 h-3.5 text-brm-secondary fill-brm-secondary shrink-0" />}
                        </div>
                        <p className="text-[10px] text-brm-text-muted mt-0.5">
                          ID: {t.id} • Season: {t.season_id || "-"} • {t.country}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="sm" isIconOnly aria-label="Editar" className="w-7 h-7 min-w-7"
                          onPress={() => { setEditingTournament(t); setIsEditOpen(true); }}>
                          <Edit className="w-3.5 h-3.5 text-brm-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" isIconOnly aria-label="Excluir" className="w-7 h-7 min-w-7"
                          onPress={() => handleDeleteTournament(t.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-brm-text-muted">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold uppercase ${fmt.color}`}>
                        <FormatIcon className="w-3 h-3" />
                        {fmt.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                        t.status === "active" ? "bg-green-500/20 text-green-400"
                          : t.status === "finished" ? "bg-gray-500/20 text-gray-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {t.status || "upcoming"}
                      </span>
                      {t.current_phase && (
                        <span className="px-1.5 py-0.5 rounded bg-white/5 font-semibold">
                          {t.current_phase}
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Tournament Details & Actions */}
          {selectedTournament && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
              <Card className="p-5 bg-brm-card border border-brm-primary/30">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-brm-text-primary">
                      {selectedTournament.name}
                    </h3>
                    <p className="text-[10px] text-brm-text-muted">
                      ID: {selectedTournament.id} • Season: {selectedTournament.season_id} • Formato: {selectedTournament.format}
                    </p>
                  </div>
                  {selectedTournament.season_id && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="bg-brm-secondary text-brm-secondary-foreground text-xs gap-1"
                        onPress={() => handleImportMatches(selectedTournament.id, selectedTournament.season_id!)} isDisabled={loading}>
                        <Download className="w-3.5 h-3.5" />
                        Importar Partidas
                      </Button>
                      <Button size="sm" variant="secondary" className="text-xs gap-1"
                        onPress={() => handleUpdateScores(selectedTournament.id, selectedTournament.season_id!)} isDisabled={loading}>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Atualizar Placares
                      </Button>
                      <Button size="sm" variant="secondary" className="text-xs gap-1"
                        onPress={() => handleImportTeams(selectedTournament.id, selectedTournament.season_id!)} isDisabled={loading}>
                        <Users className="w-3.5 h-3.5" />
                        Importar Times
                      </Button>
                    </div>
                  )}
                </div>

                <h4 className="font-display font-semibold text-xs uppercase tracking-wide text-brm-text-secondary mb-2">Temporadas</h4>
                {seasons.length === 0 ? (
                  <p className="text-xs text-brm-text-muted">Nenhuma temporada encontrada.</p>
                ) : (
                  <div className="space-y-2">
                    {seasons.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-xs font-semibold text-brm-text-primary">{s.name}</p>
                          <p className="text-[10px] text-brm-text-muted">
                            ID: {s.id} • Ano: {s.year || "-"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.is_current && (
                            <span className="px-1.5 py-0.5 rounded bg-brm-primary/20 text-brm-primary text-[10px] font-bold uppercase">
                              Atual
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </Tabs.Panel>

        {/* Add Tournament */}
        <Tabs.Panel id="add" className="pt-4">
          <Card className="p-5 bg-brm-card border border-white/5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wide text-brm-text-primary mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brm-secondary" />
              Adicionar Torneio via SofaScore
            </h3>
            <p className="text-xs text-brm-text-muted mb-4">
              Insira o ID do torneio e o Season ID do SofaScore. O sistema irá buscar automaticamente
              os dados, detectar o formato e configurar o torneio.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-brm-text-muted block mb-1">Tournament ID</label>
                <input
                  type="number"
                  placeholder="Ex: 325, 373, 384"
                  value={setupTournamentId}
                  onChange={(e) => setSetupTournamentId(e.target.value)}
                  className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-brm-text-muted block mb-1">Season ID</label>
                <input
                  type="number"
                  placeholder="Ex: 87678, 89353, 87760"
                  value={setupSeasonId}
                  onChange={(e) => setSetupSeasonId(e.target.value)}
                  className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brm-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-brm-text-muted block mb-1">Formato (opcional)</label>
                <select
                  value={setupFormat}
                  onChange={(e) => setSetupFormat(e.target.value)}
                  className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
                >
                  <option value="">Auto-detectar</option>
                  <option value="league">Liga (Pontos Corridos)</option>
                  <option value="knockout">Mata-Mata (Eliminatórias)</option>
                  <option value="mixed">Misto (Grupos + Eliminatórias)</option>
                </select>
              </div>
            </div>

            <Button
              onPress={handleSetupTournament}
              isDisabled={loading || !setupTournamentId || !setupSeasonId}
              className="bg-brm-secondary text-brm-secondary-foreground text-xs gap-1"
            >
              <Globe className="w-4 h-4" />
              Configurar Torneio
            </Button>

            {setupResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <Card className="p-4 bg-green-500/5 border border-green-500/20">
                  <h4 className="font-display font-bold text-sm text-green-400 mb-2">
                    Torneio configurado com sucesso!
                  </h4>
                  <div className="space-y-1 text-xs text-brm-text-secondary">
                    <p><strong>Nome:</strong> {setupResult.tournament.name}</p>
                    <p><strong>Formato detectado:</strong> {setupResult.detectedFormat}</p>
                    <p><strong>Rodadas/Fases:</strong> {setupResult.rounds.length}</p>
                    {setupResult.currentRound && (
                      <p><strong>Fase atual:</strong> {setupResult.currentRound.name || `Rodada ${setupResult.currentRound.round}`}</p>
                    )}
                    <p><strong>Temporadas salvas:</strong> {setupResult.seasons.length}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-brm-secondary text-brm-secondary-foreground text-xs gap-1"
                      onPress={() => handleImportMatches(setupResult.tournament.id, setupResult.tournament.season_id!)} isDisabled={loading}>
                      <Download className="w-3.5 h-3.5" />
                      Importar Partidas
                    </Button>
                    <Button size="sm" variant="secondary" className="text-xs gap-1"
                      onPress={() => handleImportTeams(setupResult.tournament.id, setupResult.tournament.season_id!)} isDisabled={loading}>
                      <Users className="w-3.5 h-3.5" />
                      Importar Times
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            <div className="mt-6 p-4 rounded-lg bg-white/5">
              <h4 className="font-display font-bold text-xs uppercase text-brm-text-secondary mb-3">
                <Search className="w-3.5 h-3.5 inline mr-1" />
                Buscar Torneio por Nome
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Brasileirão, Copa do Brasil, Libertadores..."
                  className="flex-1 bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      const result = await sofascore.call<{ tournaments: { id: number; name: string; category?: { name: string } }[] }>({
                        action: "search_tournament",
                        query: (e.target as HTMLInputElement).value,
                      });
                      if (result) {
                        const info = result.tournaments.slice(0, 5).map(t => `${t.name} (ID: ${t.id})`).join("\n");
                        setImportStatus(`Resultados:\n${info}`);
                      }
                    }
                  }}
                />
              </div>
              <p className="text-[10px] text-brm-text-muted mt-2">
                Pressione Enter para buscar. Use o ID encontrado no formulário acima.
              </p>
            </div>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Edit Modal */}
      {editingTournament && (
        <Modal>
          <Modal.Backdrop isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[480px] bg-brm-card border border-white/10">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading className="font-display font-bold text-brm-text-primary">
                    Editar Torneio
                  </Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleUpdateTournament}>
                  <Modal.Body>
                    <div className="flex flex-col gap-4">
                      <TextField name="name" defaultValue={editingTournament.name}>
                        <Label>Nome</Label>
                        <Input variant="secondary" />
                      </TextField>
                      <div className="grid grid-cols-2 gap-4">
                        <TextField name="short_name" defaultValue={editingTournament.short_name || ""}>
                          <Label>Nome Curto</Label>
                          <Input variant="secondary" />
                        </TextField>
                        <TextField name="country" defaultValue={editingTournament.country || "Brazil"}>
                          <Label>País</Label>
                          <Input variant="secondary" />
                        </TextField>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-brm-text-secondary block mb-1">Formato</label>
                          <select name="format" defaultValue={editingTournament.format || "league"}
                            className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10">
                            <option value="league">Liga</option>
                            <option value="knockout">Mata-Mata</option>
                            <option value="mixed">Misto</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-brm-text-secondary block mb-1">Status</label>
                          <select name="status" defaultValue={editingTournament.status || "upcoming"}
                            className="w-full bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10">
                            <option value="upcoming">Próximo</option>
                            <option value="active">Ativo</option>
                            <option value="finished">Finalizado</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <TextField name="season_id" defaultValue={String(editingTournament.season_id ?? "")}>
                          <Label>Season ID</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
                        <TextField name="display_order" defaultValue={String(editingTournament.display_order ?? 0)}>
                          <Label>Ordem de Exibição</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" name="is_featured" defaultChecked={editingTournament.is_featured ?? false} className="accent-brm-primary" />
                        <span className="text-sm text-brm-text-primary">Torneio em destaque</span>
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
