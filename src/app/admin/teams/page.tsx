"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Button, Modal, TextField, Input, Label } from "@heroui/react";
import { Shield, Search, Edit, Trash2, RefreshCw } from "lucide-react";
import Image from "next/image";

import { useAdminCrud } from "@/hooks/use-admin-crud";

interface TeamRow {
  id: number;
  name: string;
  short_name: string | null;
  name_code: string | null;
  slug: string | null;
  country_name: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  venue_name: string | null;
  venue_city: string | null;
  manager_name: string | null;
  primary_tournament_id: number | null;
  primary_tournament_name: string | null;
  last_sync_at: string | null;
}

export default function TeamsManagementPage() {
  const { list, update, remove, loading } = useAdminCrud();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTeam, setEditingTeam] = useState<TeamRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const fetchTeams = useCallback(async () => {
    const filters = searchTerm
      ? [{ column: "name", operator: "ilike", value: `%${searchTerm}%` }]
      : [];

    const result = await list<TeamRow>({
      table: "teams",
      filters,
      orderBy: { column: "name", ascending: true },
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });

    if (result.data) {
      setTeams(result.data as TeamRow[]);
      setTotalCount(result.count ?? 0);
    }
  }, [list, searchTerm, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTeams();
  }, [searchTerm, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTeam) return;
    const fd = new FormData(e.currentTarget);
    await update("teams", editingTeam.id, {
      name: fd.get("name") as string,
      short_name: fd.get("short_name") as string,
      name_code: fd.get("name_code") as string,
      country_name: fd.get("country_name") as string,
      venue_name: fd.get("venue_name") as string,
      venue_city: fd.get("venue_city") as string,
      manager_name: fd.get("manager_name") as string,
    });
    setIsEditOpen(false);
    setEditingTeam(null);
    fetchTeams();
  };

  const handleDeleteTeam = async (id: number) => {
    if (!confirm("Excluir este time?")) return;
    await remove("teams", id);
    fetchTeams();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brm-text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-brm-accent" />
            Gestão de Times
          </h1>
          <p className="text-sm text-brm-text-secondary mt-1">{totalCount} times cadastrados</p>
        </div>
        <Button variant="ghost" size="sm" onPress={fetchTeams} isDisabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Card className="p-4 bg-brm-card border border-white/5">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-brm-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome do time..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            className="flex-1 bg-transparent text-sm text-brm-text-primary placeholder:text-brm-text-muted outline-none"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {teams.map((team, i) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <Card className="p-3 bg-brm-card border border-white/5 hover:border-white/10 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                  <Image
                    src={`/api/team-logo/${team.id}`}
                    alt={team.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-sm text-brm-text-primary truncate">{team.name}</h3>
                  <p className="text-[10px] text-brm-text-muted">
                    {team.short_name || team.name_code || "-"} • {team.country_name || "Brazil"}
                  </p>
                  {team.venue_name && (
                    <p className="text-[10px] text-brm-text-muted truncate">
                      🏟️ {team.venue_name}{team.venue_city ? `, ${team.venue_city}` : ""}
                    </p>
                  )}
                  {team.manager_name && (
                    <p className="text-[10px] text-brm-text-muted">👤 {team.manager_name}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button variant="ghost" size="sm" isIconOnly aria-label="Editar" className="w-7 h-7 min-w-7"
                    onPress={() => { setEditingTeam(team); setIsEditOpen(true); }}>
                    <Edit className="w-3.5 h-3.5 text-brm-primary" />
                  </Button>
                  <Button variant="ghost" size="sm" isIconOnly aria-label="Excluir" className="w-7 h-7 min-w-7"
                    onPress={() => handleDeleteTeam(team.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
              {team.primary_color && (
                <div className="flex gap-1 mt-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${team.primary_color}` }} />
                  {team.secondary_color && (
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${team.secondary_color}` }} />
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {teams.length === 0 && !loading && (
        <Card className="p-8 bg-brm-card border border-white/5 text-center">
          <p className="text-sm text-brm-text-muted">Nenhum time encontrado. Importe times via Gestão de Torneios.</p>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-brm-text-muted">Página {page + 1} de {totalPages}</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" isDisabled={page === 0} onPress={() => setPage(p => p - 1)} className="text-xs">Anterior</Button>
            <Button variant="ghost" size="sm" isDisabled={page >= totalPages - 1} onPress={() => setPage(p => p + 1)} className="text-xs">Próxima</Button>
          </div>
        </div>
      )}

      {editingTeam && (
        <Modal>
          <Modal.Backdrop isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[480px] bg-brm-card border border-white/10">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading className="font-display font-bold text-brm-text-primary">Editar Time</Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleUpdateTeam}>
                  <Modal.Body>
                    <div className="flex flex-col gap-4">
                      <TextField name="name" defaultValue={editingTeam.name}>
                        <Label>Nome</Label>
                        <Input variant="secondary" />
                      </TextField>
                      <div className="grid grid-cols-2 gap-4">
                        <TextField name="short_name" defaultValue={editingTeam.short_name || ""}>
                          <Label>Nome Curto</Label>
                          <Input variant="secondary" />
                        </TextField>
                        <TextField name="name_code" defaultValue={editingTeam.name_code || ""}>
                          <Label>Código</Label>
                          <Input variant="secondary" />
                        </TextField>
                      </div>
                      <TextField name="country_name" defaultValue={editingTeam.country_name || "Brazil"}>
                        <Label>País</Label>
                        <Input variant="secondary" />
                      </TextField>
                      <div className="grid grid-cols-2 gap-4">
                        <TextField name="venue_name" defaultValue={editingTeam.venue_name || ""}>
                          <Label>Estádio</Label>
                          <Input variant="secondary" />
                        </TextField>
                        <TextField name="venue_city" defaultValue={editingTeam.venue_city || ""}>
                          <Label>Cidade</Label>
                          <Input variant="secondary" />
                        </TextField>
                      </div>
                      <TextField name="manager_name" defaultValue={editingTeam.manager_name || ""}>
                        <Label>Técnico</Label>
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
