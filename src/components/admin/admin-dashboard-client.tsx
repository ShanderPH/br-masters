"use client";

import { motion } from "framer-motion";
import { Card } from "@heroui/react";
import {
  Users,
  Trophy,
  Shield,
  Swords,
  BarChart3,
  UserRoundCog,
  CreditCard,
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import NextLink from "next/link";

interface AdminStats {
  users: number;
  matches: number;
  predictions: number;
  tournaments: number;
  teams: number;
  players: number;
  pendingPayments: number;
  pendingDeposits: number;
  prizePool: {
    total: number;
    totalApproved: number;
    totalPending: number;
    participants: number;
  };
}

interface RecentUser {
  id: string;
  name: string;
  role: string;
  points: number;
  createdAt: string;
}

interface PendingPayment {
  id: string;
  userName: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface PendingDeposit {
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface AdminDashboardClientProps {
  stats: AdminStats;
  recentUsers: RecentUser[];
  pendingPayments: PendingPayment[];
  pendingDeposits: PendingDeposit[];
}

const statCards = [
  { key: "users", label: "Usuários", icon: Users, color: "text-brm-primary", bg: "bg-brm-primary/10", href: "/admin/users" },
  { key: "tournaments", label: "Torneios", icon: Trophy, color: "text-brm-secondary", bg: "bg-brm-secondary/10", href: "/admin/tournaments" },
  { key: "teams", label: "Times", icon: Shield, color: "text-brm-accent", bg: "bg-brm-accent/10", href: "/admin/teams" },
  { key: "matches", label: "Partidas", icon: Swords, color: "text-brm-purple", bg: "bg-brm-purple/10", href: "/admin/matches" },
  { key: "predictions", label: "Palpites", icon: BarChart3, color: "text-blue-400", bg: "bg-blue-400/10", href: "/admin/scoring" },
  { key: "players", label: "Jogadores", icon: UserRoundCog, color: "text-orange-400", bg: "bg-orange-400/10", href: "/admin/players" },
] as const;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function AdminDashboardClient({
  stats,
  recentUsers,
  pendingPayments,
  pendingDeposits,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-brm-text-primary">
          Painel Admin
        </h1>
        <p className="text-sm text-brm-text-secondary mt-1">
          Visão geral do sistema BR Masters
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof typeof stats];
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NextLink href={card.href}>
                <Card className="p-3 sm:p-4 bg-brm-card dark:bg-brm-card border border-white/5 hover:border-white/10 transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${card.bg}`}>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className="font-display font-black text-xl sm:text-2xl text-brm-text-primary">
                    {typeof value === "number" ? value.toLocaleString("pt-BR") : 0}
                  </p>
                  <p className="text-[10px] sm:text-xs font-semibold text-brm-text-muted uppercase tracking-wider mt-0.5">
                    {card.label}
                  </p>
                </Card>
              </NextLink>
            </motion.div>
          );
        })}
      </div>

      {/* Prize Pool & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Prize Pool */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 sm:p-5 bg-brm-card dark:bg-brm-card border border-white/5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-brm-text-primary">
                Premiação
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-brm-text-muted uppercase">Total</p>
                <p className="font-display font-black text-2xl text-brm-secondary">
                  {formatCurrency(stats.prizePool.total)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-[10px] font-semibold text-brm-text-muted uppercase">Aprovado</p>
                  <p className="font-display font-bold text-sm text-green-400">
                    {formatCurrency(stats.prizePool.totalApproved)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-[10px] font-semibold text-brm-text-muted uppercase">Pendente</p>
                  <p className="font-display font-bold text-sm text-yellow-400">
                    {formatCurrency(stats.prizePool.totalPending)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-brm-text-secondary">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{stats.prizePool.participants} participantes</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Pending Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-4 sm:p-5 bg-brm-card dark:bg-brm-card border border-white/5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-brm-accent/10">
                  <CreditCard className="w-5 h-5 text-brm-accent" />
                </div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-brm-text-primary">
                  Saques Pendentes
                </h3>
              </div>
              {stats.pendingPayments > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brm-accent/20 text-brm-accent text-[10px] font-bold">
                  <AlertCircle className="w-3 h-3" />
                  {stats.pendingPayments}
                </span>
              )}
            </div>
            {pendingPayments.length === 0 ? (
              <p className="text-xs text-brm-text-muted">Nenhum saque pendente</p>
            ) : (
              <div className="space-y-2">
                {pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-brm-text-primary">{payment.userName}</p>
                      <p className="text-[10px] text-brm-text-muted">{formatDate(payment.createdAt)}</p>
                    </div>
                    <p className="font-display font-bold text-sm text-brm-accent">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
                <NextLink
                  href="/admin/payments"
                  className="block text-center text-xs font-semibold text-brm-primary hover:underline mt-2"
                >
                  Ver todos →
                </NextLink>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Pending Deposits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 sm:p-5 bg-brm-card dark:bg-brm-card border border-white/5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-brm-text-primary">
                  Depósitos Pendentes
                </h3>
              </div>
              {stats.pendingDeposits > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                  <AlertCircle className="w-3 h-3" />
                  {stats.pendingDeposits}
                </span>
              )}
            </div>
            {pendingDeposits.length === 0 ? (
              <p className="text-xs text-brm-text-muted">Nenhum depósito pendente</p>
            ) : (
              <div className="space-y-2">
                {pendingDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-brm-text-primary">ID: {deposit.userId}</p>
                      <p className="text-[10px] text-brm-text-muted">{formatDate(deposit.createdAt)}</p>
                    </div>
                    <p className="font-display font-bold text-sm text-yellow-400">
                      {formatCurrency(deposit.amount)}
                    </p>
                  </div>
                ))}
                <NextLink
                  href="/admin/payments"
                  className="block text-center text-xs font-semibold text-brm-primary hover:underline mt-2"
                >
                  Ver todos →
                </NextLink>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Recent Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="p-4 sm:p-5 bg-brm-card dark:bg-brm-card border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brm-primary/10">
                <Users className="w-5 h-5 text-brm-primary" />
              </div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-brm-text-primary">
                Usuários Recentes
              </h3>
            </div>
            <NextLink
              href="/admin/users"
              className="text-xs font-semibold text-brm-primary hover:underline"
            >
              Ver todos →
            </NextLink>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 px-2 font-semibold text-brm-text-muted uppercase tracking-wider">ID</th>
                  <th className="text-left py-2 px-2 font-semibold text-brm-text-muted uppercase tracking-wider">Nome</th>
                  <th className="text-left py-2 px-2 font-semibold text-brm-text-muted uppercase tracking-wider">Role</th>
                  <th className="text-right py-2 px-2 font-semibold text-brm-text-muted uppercase tracking-wider">Pontos</th>
                  <th className="text-right py-2 px-2 font-semibold text-brm-text-muted uppercase tracking-wider hidden sm:table-cell">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2 px-2 font-mono text-brm-text-secondary">{user.id}</td>
                    <td className="py-2 px-2 font-semibold text-brm-text-primary">{user.name}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.role === "admin"
                            ? "bg-brm-accent/20 text-brm-accent"
                            : "bg-brm-primary/20 text-brm-primary"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-brm-secondary">
                      {user.points.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 px-2 text-right text-brm-text-muted hidden sm:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
