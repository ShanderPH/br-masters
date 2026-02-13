"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Button, Modal, TextField, Input, Label } from "@heroui/react";
import { UserRoundCog, Search, Edit, Trash2, RefreshCw } from "lucide-react";

import { useAdminCrud } from "@/hooks/use-admin-crud";

interface PlayerRow {
  id: number;
  sofascore_id: string | null;
  name: string;
  short_name: string | null;
  team_id: number | null;
  position: string | null;
  shirt_number: number | null;
  height: number | null;
  preferred_foot: string | null;
  date_of_birth: string | null;
  country_name: string | null;
  proposed_market_value: number | null;
  proposed_market_value_currency: string | null;
  last_sync_at: string | null;
}

function getPositionLabel(pos: string | null): { label: string; class: string } {
  switch (pos) {
    case "G": return { label: "GOL", class: "bg-yellow-500/20 text-yellow-400" };
    case "D": return { label: "DEF", class: "bg-blue-500/20 text-blue-400" };
    case "M": return { label: "MEI", class: "bg-green-500/20 text-green-400" };
    case "F": return { label: "ATA", class: "bg-red-500/20 text-red-400" };
    default: return { label: pos || "-", class: "bg-gray-500/20 text-gray-400" };
  }
}

function formatMarketValue(value: number | null, currency: string | null): string {
  if (!value) return "-";
  const millions = value / 1_000_000;
  if (millions >= 1) return `${currency || "€"} ${millions.toFixed(1)}M`;
  const thousands = value / 1_000;
  return `${currency || "€"} ${thousands.toFixed(0)}K`;
}

export default function PlayersManagementPage() {
  const { list, update, remove, loading } = useAdminCrud();
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<PlayerRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const fetchPlayers = useCallback(async () => {
    const filters: { column: string; operator: string; value: unknown }[] = [];

    if (searchTerm) {
      filters.push({ column: "name", operator: "ilike", value: `%${searchTerm}%` });
    }
    if (positionFilter) {
      filters.push({ column: "position", operator: "eq", value: positionFilter });
    }

    const result = await list<PlayerRow>({
      table: "players",
      filters,
      orderBy: { column: "name", ascending: true },
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });

    if (result.data) {
      setPlayers(result.data as PlayerRow[]);
      setTotalCount(result.count ?? 0);
    }
  }, [list, searchTerm, positionFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPlayers();
  }, [searchTerm, positionFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdatePlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPlayer) return;
    const fd = new FormData(e.currentTarget);
    await update("players", editingPlayer.id, {
      name: fd.get("name") as string,
      short_name: fd.get("short_name") as string,
      position: fd.get("position") as string,
      shirt_number: Number(fd.get("shirt_number")) || null,
      height: Number(fd.get("height")) || null,
      preferred_foot: fd.get("preferred_foot") as string,
      country_name: fd.get("country_name") as string,
    });
    setIsEditOpen(false);
    setEditingPlayer(null);
    fetchPlayers();
  };

  const handleDeletePlayer = async (id: number) => {
    if (!confirm("Excluir este jogador?")) return;
    await remove("players", id);
    fetchPlayers();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brm-text-primary flex items-center gap-2">
            <UserRoundCog className="w-6 h-6 text-orange-400" />
            Gestão de Jogadores
          </h1>
          <p className="text-sm text-brm-text-secondary mt-1">{totalCount} jogadores cadastrados</p>
        </div>
        <Button variant="ghost" size="sm" onPress={fetchPlayers} isDisabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-brm-card border border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-brm-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="flex-1 bg-transparent text-sm text-brm-text-primary placeholder:text-brm-text-muted outline-none"
            />
          </div>
          <select
            value={positionFilter}
            onChange={(e) => { setPositionFilter(e.target.value); setPage(0); }}
            className="bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
          >
            <option value="">Todas Posições</option>
            <option value="G">Goleiro</option>
            <option value="D">Defensor</option>
            <option value="M">Meio-campo</option>
            <option value="F">Atacante</option>
          </select>
        </div>
      </Card>

      {/* Players Table */}
      <Card className="bg-brm-card border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="text-left py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-center py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider">Pos</th>
                <th className="text-center py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider">#</th>
                <th className="text-left py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider hidden sm:table-cell">País</th>
                <th className="text-center py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider hidden md:table-cell">Pé</th>
                <th className="text-right py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider hidden lg:table-cell">Valor</th>
                <th className="text-center py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => {
                const pos = getPositionLabel(player.position);
                return (
                  <motion.tr
                    key={player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <div>
                        <p className="font-semibold text-brm-text-primary">{player.name}</p>
                        {player.short_name && player.short_name !== player.name && (
                          <p className="text-[10px] text-brm-text-muted">{player.short_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${pos.class}`}>
                        {pos.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-brm-text-secondary">
                      {player.shirt_number ?? "-"}
                    </td>
                    <td className="py-2.5 px-3 text-brm-text-muted hidden sm:table-cell">{player.country_name || "-"}</td>
                    <td className="py-2.5 px-3 text-center text-brm-text-muted hidden md:table-cell capitalize">
                      {player.preferred_foot || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-brm-secondary hidden lg:table-cell">
                      {formatMarketValue(player.proposed_market_value, player.proposed_market_value_currency)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" isIconOnly aria-label="Editar" className="w-7 h-7 min-w-7"
                          onPress={() => { setEditingPlayer(player); setIsEditOpen(true); }}>
                          <Edit className="w-3.5 h-3.5 text-brm-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" isIconOnly aria-label="Excluir" className="w-7 h-7 min-w-7"
                          onPress={() => handleDeletePlayer(player.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {players.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-brm-text-muted">
                    Nenhum jogador encontrado
                  </td>
                </tr>
              )}
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

      {/* Edit Modal */}
      {editingPlayer && (
        <Modal>
          <Modal.Backdrop isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[480px] bg-brm-card border border-white/10">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading className="font-display font-bold text-brm-text-primary">Editar Jogador</Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleUpdatePlayer}>
                  <Modal.Body>
                    <div className="flex flex-col gap-4">
                      <TextField name="name" defaultValue={editingPlayer.name}>
                        <Label>Nome</Label>
                        <Input variant="secondary" />
                      </TextField>
                      <div className="grid grid-cols-2 gap-4">
                        <TextField name="short_name" defaultValue={editingPlayer.short_name || ""}>
                          <Label>Nome Curto</Label>
                          <Input variant="secondary" />
                        </TextField>
                        <TextField name="position" defaultValue={editingPlayer.position || ""}>
                          <Label>Posição (G/D/M/F)</Label>
                          <Input variant="secondary" />
                        </TextField>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <TextField name="shirt_number" defaultValue={String(editingPlayer.shirt_number ?? "")}>
                          <Label>Camisa</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
                        <TextField name="height" defaultValue={String(editingPlayer.height ?? "")}>
                          <Label>Altura (cm)</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
                        <TextField name="preferred_foot" defaultValue={editingPlayer.preferred_foot || ""}>
                          <Label>Pé</Label>
                          <Input variant="secondary" />
                        </TextField>
                      </div>
                      <TextField name="country_name" defaultValue={editingPlayer.country_name || ""}>
                        <Label>País</Label>
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
