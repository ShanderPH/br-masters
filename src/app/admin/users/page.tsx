"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Button, Modal, TextField, Input, Label } from "@heroui/react";
import { Users, Search, Edit, Trash2, RefreshCw } from "lucide-react";

import { useAdminCrud } from "@/hooks/use-admin-crud";

interface UserRow {
  id: string;
  firebase_id: string;
  name: string;
  email: string | null;
  role: string | null;
  points: number | null;
  predictions_count: number | null;
  xp: number | null;
  level: number | null;
  favorite_team_name: string | null;
  notifications_enabled: boolean | null;
  public_profile: boolean | null;
  pending_payments: number | null;
  total_approved_payments: number | null;
  created_at: string | null;
}

export default function UsersManagementPage() {
  const { list, update, remove, loading } = useAdminCrud();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchUsers = useCallback(async () => {
    const filters = searchTerm
      ? [{ column: "name", operator: "ilike", value: `%${searchTerm}%` }]
      : [];

    const result = await list<UserRow>({
      table: "users_profiles",
      filters,
      orderBy: { column: "created_at", ascending: false },
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });

    if (result.data) {
      setUsers(result.data as UserRow[]);
      setTotalCount(result.count ?? 0);
    }
  }, [list, searchTerm, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [searchTerm, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.currentTarget);
    await update("users_profiles", editingUser.id, {
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      points: Number(formData.get("points")),
      xp: Number(formData.get("xp")),
      level: Number(formData.get("level")),
    });

    setIsEditOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    await remove("users_profiles", userId);
    fetchUsers();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brm-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-brm-primary" />
            Gestão de Usuários
          </h1>
          <p className="text-sm text-brm-text-secondary mt-1">
            {totalCount} usuários cadastrados
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onPress={fetchUsers}
          isDisabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 bg-brm-card border border-white/5">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-brm-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            className="flex-1 bg-transparent text-sm text-brm-text-primary placeholder:text-brm-text-muted outline-none"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card className="bg-brm-card border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="text-left py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider">ID</th>
                <th className="text-left py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-center py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider">Role</th>
                <th className="text-right py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider">Pts</th>
                <th className="text-right py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider hidden sm:table-cell">LVL</th>
                <th className="text-left py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider hidden lg:table-cell">Time</th>
                <th className="text-center py-3 px-3 font-semibold text-brm-text-muted uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-brm-text-secondary">{user.firebase_id}</td>
                  <td className="py-2.5 px-3 font-semibold text-brm-text-primary">{user.name}</td>
                  <td className="py-2.5 px-3 text-brm-text-muted hidden md:table-cell truncate max-w-[180px]">
                    {user.email || "-"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      user.role === "admin"
                        ? "bg-brm-accent/20 text-brm-accent"
                        : "bg-brm-primary/20 text-brm-primary"
                    }`}>
                      {user.role || "user"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-brm-secondary">
                    {(user.points ?? 0).toLocaleString("pt-BR")}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-brm-text-secondary hidden sm:table-cell">
                    {user.level ?? 1}
                  </td>
                  <td className="py-2.5 px-3 text-brm-text-muted hidden lg:table-cell truncate max-w-[120px]">
                    {user.favorite_team_name || "-"}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        aria-label="Editar"
                        onPress={() => { setEditingUser(user); setIsEditOpen(true); }}
                        className="w-7 h-7 min-w-7"
                      >
                        <Edit className="w-3.5 h-3.5 text-brm-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        aria-label="Excluir"
                        onPress={() => handleDeleteUser(user.id)}
                        className="w-7 h-7 min-w-7"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-brm-text-muted">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-brm-text-muted">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                isDisabled={page === 0}
                onPress={() => setPage(p => p - 1)}
                className="text-xs"
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                isDisabled={page >= totalPages - 1}
                onPress={() => setPage(p => p + 1)}
                className="text-xs"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {editingUser && (
        <Modal>
          <Modal.Backdrop isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[440px] bg-brm-card border border-white/10">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading className="font-display font-bold text-brm-text-primary">
                    Editar Usuário
                  </Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleUpdateUser}>
                  <Modal.Body>
                    <div className="flex flex-col gap-4">
                      <TextField name="name" defaultValue={editingUser.name}>
                        <Label>Nome</Label>
                        <Input variant="secondary" />
                      </TextField>
                      <TextField name="role" defaultValue={editingUser.role || "user"}>
                        <Label>Role</Label>
                        <Input variant="secondary" />
                      </TextField>
                      <TextField name="points" defaultValue={String(editingUser.points ?? 0)}>
                        <Label>Pontos</Label>
                        <Input variant="secondary" type="number" />
                      </TextField>
                      <div className="grid grid-cols-2 gap-4">
                        <TextField name="xp" defaultValue={String(editingUser.xp ?? 0)}>
                          <Label>XP</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
                        <TextField name="level" defaultValue={String(editingUser.level ?? 1)}>
                          <Label>Nível</Label>
                          <Input variant="secondary" type="number" />
                        </TextField>
                      </div>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="ghost" slot="close" className="mr-2">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-brm-primary text-brm-primary-foreground">
                      Salvar
                    </Button>
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
