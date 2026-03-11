"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Button, Modal, TextField, Input, Label, Tabs } from "@heroui/react";
import {
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import { useAdminCrud } from "@/hooks/use-admin-crud";

interface TransactionRow {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(dateStr));
}

function getPaymentStatusBadge(status: string): { label: string; class: string; icon: typeof Clock } {
  switch (status) {
    case "approved": case "confirmed": return { label: "Aprovado", class: "bg-green-500/20 text-green-400", icon: CheckCircle };
    case "pending": return { label: "Pendente", class: "bg-yellow-500/20 text-yellow-400", icon: Clock };
    case "rejected": case "cancelled": return { label: "Rejeitado", class: "bg-red-500/20 text-red-400", icon: XCircle };
    default: return { label: status, class: "bg-gray-500/20 text-gray-400", icon: Clock };
  }
}

export default function PaymentsManagementPage() {
  const { list, apiCall, loading } = useAdminCrud();

  const [withdrawals, setWithdrawals] = useState<TransactionRow[]>([]);
  const [deposits, setDeposits] = useState<TransactionRow[]>([]);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("");
  const [depositStatusFilter, setDepositStatusFilter] = useState("");
  const [payPage, setPayPage] = useState(0);
  const [depPage, setDepPage] = useState(0);
  const PAGE_SIZE = 20;

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: "withdrawal" | "deposit" } | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    const filters: { column: string; operator: string; value: unknown }[] = [
      { column: "type", operator: "eq", value: "withdrawal" },
    ];
    if (withdrawalStatusFilter) {
      filters.push({ column: "status", operator: "eq", value: withdrawalStatusFilter });
    }

    const result = await list<TransactionRow>({
      table: "transactions",
      filters,
      orderBy: { column: "created_at", ascending: false },
      limit: PAGE_SIZE,
      offset: payPage * PAGE_SIZE,
    });

    if (result.data) {
      setWithdrawals(result.data as TransactionRow[]);
      setTotalWithdrawals(result.count ?? 0);
    }
  }, [list, withdrawalStatusFilter, payPage]);

  const fetchDeposits = useCallback(async () => {
    const filters: { column: string; operator: string; value: unknown }[] = [
      { column: "type", operator: "eq", value: "deposit" },
    ];
    if (depositStatusFilter) {
      filters.push({ column: "status", operator: "eq", value: depositStatusFilter });
    }

    const result = await list<TransactionRow>({
      table: "transactions",
      filters,
      orderBy: { column: "created_at", ascending: false },
      limit: PAGE_SIZE,
      offset: depPage * PAGE_SIZE,
    });

    if (result.data) {
      setDeposits(result.data as TransactionRow[]);
      setTotalDeposits(result.count ?? 0);
    }
  }, [list, depositStatusFilter, depPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchWithdrawals();
  }, [withdrawalStatusFilter, payPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDeposits();
  }, [depositStatusFilter, depPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApproveTransaction = async (id: string) => {
    if (!confirm("Aprovar esta transação?")) return;
    await apiCall({ action: "approve_transaction", table: "transactions", id });
    fetchWithdrawals();
    fetchDeposits();
  };

  const handleReject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rejectTarget) return;
    const fd = new FormData(e.currentTarget);
    const reason = fd.get("reason") as string;

    await apiCall({ action: "reject_transaction", table: "transactions", id: rejectTarget.id, description: reason });
    fetchWithdrawals();
    fetchDeposits();

    setRejectModalOpen(false);
    setRejectTarget(null);
  };

  const withdrawalPages = Math.ceil(totalWithdrawals / PAGE_SIZE);
  const depositPages = Math.ceil(totalDeposits / PAGE_SIZE);

  const pendingWithdrawalsCount = withdrawals.filter(p => p.status === "pending").length;
  const pendingDepositsCount = deposits.filter(d => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brm-text-primary flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brm-accent" />
            Gestão de Pagamentos
          </h1>
          <p className="text-sm text-brm-text-secondary mt-1">
            Gerencie saques e depósitos
          </p>
        </div>
        <Button variant="ghost" size="sm" onPress={() => { fetchWithdrawals(); fetchDeposits(); }} isDisabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-brm-card border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-semibold text-brm-text-muted uppercase">Saques</span>
          </div>
          <p className="font-display font-black text-lg text-brm-text-primary">{totalWithdrawals}</p>
        </Card>
        <Card className="p-3 bg-brm-card border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-semibold text-brm-text-muted uppercase">Depósitos</span>
          </div>
          <p className="font-display font-black text-lg text-brm-text-primary">{totalDeposits}</p>
        </Card>
        <Card className="p-3 bg-brm-card border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-[10px] font-semibold text-brm-text-muted uppercase">Saques Pend.</span>
          </div>
          <p className="font-display font-black text-lg text-yellow-400">{pendingWithdrawalsCount}</p>
        </Card>
        <Card className="p-3 bg-brm-card border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-[10px] font-semibold text-brm-text-muted uppercase">Dep. Pend.</span>
          </div>
          <p className="font-display font-black text-lg text-yellow-400">{pendingDepositsCount}</p>
        </Card>
      </div>

      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Tipo de Pagamento" className="*:font-display *:font-semibold *:text-xs *:uppercase">
            <Tabs.Tab id="payments">Saques ({totalWithdrawals})<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="deposits">Depósitos ({totalDeposits})<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* Payments (Withdrawals) */}
        <Tabs.Panel id="payments" className="pt-4 space-y-4">
          <Card className="p-3 bg-brm-card border border-white/5">
            <select
              value={withdrawalStatusFilter}
              onChange={(e) => { setWithdrawalStatusFilter(e.target.value); setPayPage(0); }}
              className="bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
            >
              <option value="">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </Card>

          <div className="space-y-2">
            {withdrawals.map((tx, i) => {
              const badge = getPaymentStatusBadge(tx.status);
              const StatusIcon = badge.icon;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card className="p-4 bg-brm-card border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-display font-bold text-sm text-brm-text-primary">Usuário: {tx.user_id.slice(0, 8)}</p>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${badge.class}`}>
                            <StatusIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-brm-text-muted">
                          <span>Criado: {formatDate(tx.created_at)}</span>
                          {tx.description && <span>Descrição: {tx.description}</span>}
                          {tx.reference_id && <span>Ref: {tx.reference_id}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-display font-black text-lg text-brm-accent">{formatCurrency(tx.amount)}</p>
                        {tx.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" onPress={() => handleApproveTransaction(tx.id)}
                              className="bg-green-500/20 text-green-400 text-xs gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Aprovar
                            </Button>
                            <Button size="sm" onPress={() => { setRejectTarget({ id: tx.id, type: "withdrawal" }); setRejectModalOpen(true); }}
                              className="bg-red-500/20 text-red-400 text-xs gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {withdrawals.length === 0 && !loading && (
              <Card className="p-8 bg-brm-card border border-white/5 text-center">
                <p className="text-sm text-brm-text-muted">Nenhum saque encontrado</p>
              </Card>
            )}
          </div>

          {withdrawalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-brm-text-muted">Página {payPage + 1} de {withdrawalPages}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" isDisabled={payPage === 0} onPress={() => setPayPage(p => p - 1)} className="text-xs">Anterior</Button>
                <Button variant="ghost" size="sm" isDisabled={payPage >= withdrawalPages - 1} onPress={() => setPayPage(p => p + 1)} className="text-xs">Próxima</Button>
              </div>
            </div>
          )}
        </Tabs.Panel>

        {/* Deposits */}
        <Tabs.Panel id="deposits" className="pt-4 space-y-4">
          <Card className="p-3 bg-brm-card border border-white/5">
            <select
              value={depositStatusFilter}
              onChange={(e) => { setDepositStatusFilter(e.target.value); setDepPage(0); }}
              className="bg-white/5 text-sm text-brm-text-primary rounded-lg px-3 py-2 outline-none border border-white/10"
            >
              <option value="">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </Card>

          <div className="space-y-2">
            {deposits.map((tx, i) => {
              const badge = getPaymentStatusBadge(tx.status);
              const StatusIcon = badge.icon;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card className="p-4 bg-brm-card border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-display font-bold text-sm text-brm-text-primary">
                            Usuário: {tx.user_id.slice(0, 8)}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${badge.class}`}>
                            <StatusIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-brm-text-muted">
                          <span>Criado: {formatDate(tx.created_at)}</span>
                          {tx.description && <span>Descrição: {tx.description}</span>}
                          {tx.reference_id && <span>Ref: {tx.reference_id}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-display font-black text-lg text-green-400">{formatCurrency(tx.amount)}</p>
                        {tx.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" onPress={() => handleApproveTransaction(tx.id)}
                              className="bg-green-500/20 text-green-400 text-xs gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Confirmar
                            </Button>
                            <Button size="sm" onPress={() => { setRejectTarget({ id: tx.id, type: "deposit" }); setRejectModalOpen(true); }}
                              className="bg-red-500/20 text-red-400 text-xs gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {deposits.length === 0 && !loading && (
              <Card className="p-8 bg-brm-card border border-white/5 text-center">
                <p className="text-sm text-brm-text-muted">Nenhum depósito encontrado</p>
              </Card>
            )}
          </div>

          {depositPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-brm-text-muted">Página {depPage + 1} de {depositPages}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" isDisabled={depPage === 0} onPress={() => setDepPage(p => p - 1)} className="text-xs">Anterior</Button>
                <Button variant="ghost" size="sm" isDisabled={depPage >= depositPages - 1} onPress={() => setDepPage(p => p + 1)} className="text-xs">Próxima</Button>
              </div>
            </div>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Reject/Cancel Modal */}
      {rejectTarget && (
        <Modal>
          <Modal.Backdrop isOpen={rejectModalOpen} onOpenChange={setRejectModalOpen}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[400px] bg-brm-card border border-white/10">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading className="font-display font-bold text-brm-text-primary">
                    {rejectTarget.type === "withdrawal" ? "Rejeitar Saque" : "Cancelar Depósito"}
                  </Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleReject}>
                  <Modal.Body>
                    <TextField name="reason">
                      <Label>Motivo</Label>
                      <Input variant="secondary" placeholder="Informe o motivo..." />
                    </TextField>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="ghost" slot="close" className="mr-2">Cancelar</Button>
                    <Button type="submit" className="bg-red-500 text-white">
                      {rejectTarget.type === "withdrawal" ? "Rejeitar" : "Cancelar Depósito"}
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
