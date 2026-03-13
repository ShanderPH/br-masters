"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import {
  User,
  Mail,
  Trophy,
  Target,
  Crosshair,
  BarChart3,
  Star,
  Zap,
  ArrowLeft,
  Pencil,
  Shield,
  Check,
  X,
} from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { DashboardBackground } from "@/components/dashboard";
import { signOut } from "@/lib/auth/auth-service";
import { createClient } from "@/lib/supabase/client";
import { getUserLevelInfo, XP_PER_LEVEL } from "@/lib/services/xp-service";
import { ROUTES } from "@/lib/routes";

interface ProfileUser {
  id: string;
  username: string;
  firebaseId: string | null;
  role: "user" | "admin";
  firstName: string;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  level: number;
  xp: number;
  favoriteTeamName: string | null;
  favoriteTeamLogo: string | null;
}

interface ProfileStats {
  totalPredictions: number;
  correctPredictions: number;
  exactScores: number;
  accuracy: number;
}

interface ProfileClientProps {
  user: ProfileUser;
  stats: ProfileStats;
}

export function ProfileClient({ user, stats }: ProfileClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const levelInfo = getUserLevelInfo(user.xp, user.level);
  const displayName = `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;

  const handleLogout = async () => {
    await signOut();
    router.push(ROUTES.LOGIN);
    router.refresh();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
        } as never)
        .eq("id", user.id);

      if (error) {
        setSaveError("Erro ao salvar. Tente novamente.");
      } else {
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      setSaveError("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName || "");
    setIsEditing(false);
    setSaveError(null);
  };

  const statCards = [
    {
      label: "Palpites",
      value: stats.totalPredictions,
      icon: <Target className="w-5 h-5" />,
      color: "text-brm-primary",
      bg: "bg-brm-primary/10",
    },
    {
      label: "Acertos",
      value: stats.correctPredictions,
      icon: <Check className="w-5 h-5" />,
      color: "text-brm-secondary",
      bg: "bg-brm-secondary/10",
    },
    {
      label: "Exatos",
      value: stats.exactScores,
      icon: <Crosshair className="w-5 h-5" />,
      color: "text-brm-accent",
      bg: "bg-brm-accent/10",
    },
    {
      label: "Taxa",
      value: `${stats.accuracy}%`,
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-brm-purple",
      bg: "bg-brm-purple/10",
    },
  ];

  return (
    <div className="min-h-screen relative">
      <DashboardBackground />

      <div className="relative z-10">
        <Navbar
          isAuthenticated={true}
          user={{
            id: user.id,
            name: displayName,
            points: user.totalPoints,
            level: user.level,
            xp: user.xp,
            role: user.role,
          }}
          onLogout={handleLogout}
        />

        <main className="pt-20 md:pt-24 pb-24 px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push(ROUTES.DASHBOARD)}
              className="flex items-center gap-2 text-brm-text-secondary hover:text-brm-primary transition-colors mb-6 font-display font-semibold text-sm uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </motion.button>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden"
            >
              {/* Header gradient */}
              <div className="h-24 bg-linear-to-r from-brm-primary/30 via-brm-purple/20 to-brm-accent/30 relative">
                <div className="absolute inset-0 diagonal-stripes" />
              </div>

              {/* Avatar area */}
              <div className="px-6 -mt-12">
                <div className="flex items-end gap-4">
                  <div className="relative w-24 h-24 rounded-full border-4 border-brm-background bg-brm-card overflow-hidden shrink-0">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-brm-primary to-brm-accent flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                    {user.favoriteTeamLogo && (
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-brm-background bg-brm-card overflow-hidden">
                        <Image
                          src={user.favoriteTeamLogo}
                          alt=""
                          fill
                          className="object-contain p-0.5"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pb-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="font-display font-black text-xl text-brm-text-primary uppercase tracking-wide truncate">
                        {displayName}
                      </h1>
                      {user.role === "admin" && (
                        <Shield className="w-4 h-4 text-brm-accent shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-brm-text-muted">@{user.username}</p>
                  </div>

                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setIsEditing(true)}
                      className="mb-2 text-brm-primary"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Edit mode */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-white/5 border border-white/10 p-4 space-y-4"
                  >
                    <h3 className="text-xs font-bold text-brm-text-muted uppercase tracking-wider">
                      Editar Informações
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-brm-text-muted uppercase tracking-wider font-bold">
                          Nome
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 text-brm-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brm-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-brm-text-muted uppercase tracking-wider font-bold">
                          Sobrenome
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 text-brm-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brm-primary"
                        />
                      </div>
                    </div>

                    {saveError && (
                      <p className="text-sm text-red-400">{saveError}</p>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={handleCancel}
                        isDisabled={isSaving}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onPress={handleSave}
                        isPending={isSaving}
                        isDisabled={!firstName.trim()}
                        className="bg-brm-primary text-brm-primary-foreground"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Salvar
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Info rows */}
                <div className="space-y-3">
                  {user.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-brm-text-muted shrink-0" />
                      <span className="text-brm-text-secondary">{user.email}</span>
                    </div>
                  )}
                  {user.favoriteTeamName && (
                    <div className="flex items-center gap-3 text-sm">
                      <Trophy className="w-4 h-4 text-brm-text-muted shrink-0" />
                      <span className="text-brm-text-secondary">{user.favoriteTeamName}</span>
                    </div>
                  )}
                </div>

                {/* Level + XP */}
                <div className="bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-brm-secondary fill-brm-secondary" />
                      <span className="font-display font-bold text-sm text-brm-text-primary uppercase">
                        Nível {levelInfo.level}
                      </span>
                      <span className={`text-xs font-bold ${levelInfo.color}`}>
                        {levelInfo.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-brm-accent fill-brm-accent" />
                      <span className="font-display font-bold text-brm-accent">
                        {user.totalPoints.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/10 overflow-hidden rounded-full">
                    <div
                      className={`h-full transition-all duration-500 ${levelInfo.bgColor}`}
                      style={{ width: `${levelInfo.progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-brm-text-muted mt-1">
                    {levelInfo.xpInLevel} / {XP_PER_LEVEL} XP •{" "}
                    {XP_PER_LEVEL - levelInfo.xpInLevel} XP para o próximo nível
                  </p>
                </div>

                {/* Stats grid */}
                <div>
                  <h3 className="text-xs font-bold text-brm-text-muted uppercase tracking-wider mb-3">
                    Estatísticas de Palpites
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {statCards.map((stat) => (
                      <motion.div
                        key={stat.label}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/5 border border-white/10 p-3 text-center"
                      >
                        <div
                          className={`w-10 h-10 mx-auto mb-2 flex items-center justify-center ${stat.bg} ${stat.color}`}
                        >
                          {stat.icon}
                        </div>
                        <p className="font-display font-black text-xl text-brm-text-primary">
                          {stat.value}
                        </p>
                        <p className="text-[10px] text-brm-text-muted uppercase tracking-wider font-bold">
                          {stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
