"use client";

import { useEffect, useState } from "react";
import type { Key } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NextLink from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button, ListBox, Select } from "@heroui/react";
import {
  AlertCircle,
  Camera,
  Check,
  Mail,
  Eye,
  EyeOff,
  Lock,
  Phone,
  Shield,
  User,
  UserPlus,
} from "lucide-react";

import { BRMLogo } from "@/components/ui/brm-logo";
import { ButtonLoadingDots } from "@/components/ui/button-loading-dots";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/schemas";
import { ERROR_MESSAGES } from "@/lib/error-messages";
import { ROUTES } from "@/lib/routes";

interface TeamOption {
  id: string;
  name: string;
  logo_url: string | null;
}

const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;

function formatWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [favoriteTeamId, setFavoriteTeamId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdFirebaseId, setCreatedFirebaseId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    let isMounted = true;

    const loadTeams = async () => {
      const supabase = createClient();
      const { data, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (!teamsError && data) {
        setTeams(data as TeamOption[]);
      }

      setIsLoadingTeams(false);
    };

    loadTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateFields = (): boolean => {
    const result = registerSchema.safeParse({
      firstName,
      lastName,
      email,
      favoriteTeamId,
      whatsapp,
      cpf,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({
        ...prev,
        avatar: "Selecione um arquivo de imagem válido",
      }));
      return;
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      setFieldErrors((prev) => ({
        ...prev,
        avatar: "O avatar deve ter até 2MB",
      }));
      return;
    }

    if (avatarPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    clearFieldError("avatar");
  };

  const handleTeamChange = (value: Key | Key[] | null) => {
    if (typeof value === "string") {
      setFavoriteTeamId(value);
      clearFieldError("favoriteTeamId");
      return;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
      setFavoriteTeamId(value[0]);
      clearFieldError("favoriteTeamId");
      return;
    }

    setFavoriteTeamId("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validateFields()) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();

      const confirmRedirectTo = `${window.location.origin}${ROUTES.AUTH_CONFIRM}?next=${encodeURIComponent(
        ROUTES.REGISTER_CONFIRMED
      )}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: confirmRedirectTo,
        },
      });

      if (authError || !authData.user) {
        if (authError?.message.includes("already registered")) {
          setError(ERROR_MESSAGES.AUTH.EMAIL_IN_USE);
        } else {
          setError(ERROR_MESSAGES.AUTH.REGISTRATION_FAILED);
        }
        return;
      }

      const completeFormData = new FormData();
      completeFormData.append("userId", authData.user.id);
      completeFormData.append("firstName", firstName.trim());
      completeFormData.append("lastName", lastName.trim());
      completeFormData.append("email", normalizedEmail);
      completeFormData.append("favoriteTeamId", favoriteTeamId);
      completeFormData.append("whatsapp", whatsapp.replace(/\D/g, ""));
      completeFormData.append("cpf", cpf.replace(/\D/g, ""));

      if (avatarFile) {
        completeFormData.append("avatar", avatarFile);
      }

      const profileResponse = await fetch("/api/auth/register-profile", {
        method: "POST",
        body: completeFormData,
      });

      const profilePayload = (await profileResponse.json()) as {
        error?: string;
        firebaseId?: string;
      };

      if (!profileResponse.ok) {
        setError(profilePayload.error || ERROR_MESSAGES.AUTH.REGISTRATION_FAILED);
        return;
      }

      setCreatedFirebaseId(profilePayload.firebaseId ?? null);
      setSuccess(true);

    } catch {
      setError(ERROR_MESSAGES.AUTH.REGISTRATION_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { level: score, label: "Fraca", color: "bg-red-500" };
    if (score <= 3) return { level: score, label: "Média", color: "bg-yellow-500" };
    return { level: score, label: "Forte", color: "bg-green-500" };
  };

  const strength = getPasswordStrength();

  if (success) {
    return (
      <div className="fixed inset-0 bg-brm-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/5 border border-white/10 text-center p-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500" />
          </div>

          <h1 className="font-display font-black text-xl text-brm-text-primary uppercase mb-2">
            Cadastro Quase Concluído
          </h1>

          <p className="text-brm-text-secondary text-sm mb-4">
            Enviamos um e-mail de confirmação. Clique no link para ativar sua conta e finalizar o cadastro.
          </p>

          <div className="bg-white/5 border border-white/10 py-3 px-4 mb-6">
            <p className="text-[11px] text-brm-text-muted uppercase tracking-wider mb-1">ID do Palpiteiro</p>
            <p className="font-display text-2xl text-brm-secondary font-black tracking-widest">
              {createdFirebaseId ?? "Gerando..."}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onPress={() => router.push(ROUTES.LOGIN)}
              className="w-full rounded-none uppercase font-black tracking-wide"
            >
              Ir para Login
            </Button>
            <p className="text-xs text-brm-text-muted">
              Dica: verifique caixa de spam e promoções caso o e-mail não apareça em alguns minutos.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/images/arrascaeta_background.png"
          alt="BR Masters Background"
          fill
          className="object-cover object-top"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-brm-background/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(26,26,46,0.8)_70%,rgba(26,26,46,0.95)_100%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brm-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brm-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start md:justify-center px-4 py-6 md:py-10">
        <div className="w-full max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-5"
          >
            <div className="drop-shadow-[0_0_30px_rgba(37,184,184,0.4)]">
              <BRMLogo size="sm" animated showText />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-linear-to-b from-brm-primary/30 via-brm-primary/10 to-transparent opacity-50 blur-sm" />

            <div className="relative bg-white/5 backdrop-blur-xl backdrop-saturate-150 border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-5 md:p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-10 bg-linear-to-b from-brm-primary via-brm-secondary to-brm-accent" />
                  <div>
                    <h1 className="text-lg md:text-xl font-bold text-white uppercase tracking-wide">
                      Criar Conta
                    </h1>
                    <p className="text-brm-text-primary/80 text-xs md:text-sm">
                      Cadastro de Palpiteiro BR Masters
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  <div className="flex flex-col items-center gap-2">
                    <label
                      htmlFor="avatar"
                      className="cursor-pointer group"
                    >
                      <div className="w-24 h-24 bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden relative">
                        {avatarPreviewUrl ? (
                          <Image
                            src={avatarPreviewUrl}
                            alt="Preview do avatar"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Camera className="w-7 h-7 text-brm-text-muted group-hover:text-brm-primary transition-colors" />
                        )}
                      </div>
                    </label>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <p className="text-[11px] text-brm-text-muted text-center">
                      Avatar opcional (máx. 2MB)
                    </p>
                    {fieldErrors.avatar && (
                      <p className="text-xs text-red-400">{fieldErrors.avatar}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        Nome *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(event) => {
                            setFirstName(event.target.value);
                            clearFieldError("firstName");
                          }}
                          placeholder="Seu nome"
                          disabled={isSubmitting}
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                        />
                      </div>
                      {fieldErrors.firstName && (
                        <p className="text-xs text-red-400">{fieldErrors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        Sobrenome *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type="text"
                          value={lastName}
                          onChange={(event) => {
                            setLastName(event.target.value);
                            clearFieldError("lastName");
                          }}
                          placeholder="Seu sobrenome"
                          disabled={isSubmitting}
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                        />
                      </div>
                      {fieldErrors.lastName && (
                        <p className="text-xs text-red-400">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        E-mail *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            clearFieldError("email");
                          }}
                          placeholder="seu@email.com"
                          disabled={isSubmitting}
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="text-xs text-red-400">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        WhatsApp *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type="tel"
                          value={whatsapp}
                          onChange={(event) => {
                            setWhatsapp(formatWhatsapp(event.target.value));
                            clearFieldError("whatsapp");
                          }}
                          placeholder="(11) 99999-9999"
                          disabled={isSubmitting}
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                        />
                      </div>
                      {fieldErrors.whatsapp && (
                        <p className="text-xs text-red-400">{fieldErrors.whatsapp}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        Time do Coração *
                      </label>
                      <Select
                        name="favorite_team"
                        aria-label="Time do coração"
                        placeholder={isLoadingTeams ? "Carregando times..." : "Selecione seu time"}
                        value={favoriteTeamId || null}
                        onChange={handleTeamChange}
                        isDisabled={isSubmitting || isLoadingTeams || teams.length === 0}
                        className="w-full"
                      >
                        <Select.Trigger className="rounded-none bg-white/10 border border-white/20 text-brm-text-primary">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {teams.map((team) => (
                              <ListBox.Item id={team.id} key={team.id} textValue={team.name}>
                                <div className="flex items-center gap-2 py-1">
                                  {team.logo_url ? (
                                    <Image
                                      src={team.logo_url}
                                      alt={team.name}
                                      width={22}
                                      height={22}
                                      className="object-contain"
                                    />
                                  ) : (
                                    <Shield className="w-5 h-5 text-brm-primary" />
                                  )}
                                  <span className="text-sm text-brm-text-primary">{team.name}</span>
                                </div>
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      {fieldErrors.favoriteTeamId && (
                        <p className="text-xs text-red-400">{fieldErrors.favoriteTeamId}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        CPF (opcional)
                      </label>
                      <input
                        type="text"
                        value={cpf}
                        onChange={(event) => {
                          setCpf(formatCpf(event.target.value));
                          clearFieldError("cpf");
                        }}
                        placeholder="000.000.000-00"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                      />
                      {fieldErrors.cpf && (
                        <p className="text-xs text-red-400">{fieldErrors.cpf}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        Senha *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            clearFieldError("password");
                          }}
                          placeholder="••••••"
                          disabled={isSubmitting}
                          autoComplete="new-password"
                          className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brm-text-muted hover:text-brm-primary transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/10 overflow-hidden">
                            <div
                              className={`h-full ${strength.color} transition-all`}
                              style={{ width: `${(strength.level / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-brm-text-muted">{strength.label}</span>
                        </div>
                      )}
                      {fieldErrors.password && (
                        <p className="text-xs text-red-400">{fieldErrors.password}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            clearFieldError("confirmPassword");
                          }}
                          placeholder="••••••"
                          disabled={isSubmitting}
                          autoComplete="new-password"
                          className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brm-text-muted hover:text-brm-primary transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        key="register-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-500/10 border-l-2 border-red-500 px-3 py-2 flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-400">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    fullWidth
                    isDisabled={isSubmitting}
                    isPending={isSubmitting}
                    className="h-12 bg-linear-to-r from-brm-primary to-brm-primary/80 hover:from-brm-primary/90 hover:to-brm-primary text-brm-background font-bold uppercase tracking-wider shadow-lg shadow-brm-primary/30 transition-all duration-200 rounded-none"
                    style={{ clipPath: "polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)" }}
                  >
                    {({ isPending }) => (
                      <>
                        {isPending ? (
                          <ButtonLoadingDots size="sm" color="current" />
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            <span className="ml-2">Criar Conta</span>
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-5 pt-4 border-t border-white/10 text-center">
                  <p className="text-sm text-brm-text-secondary">
                    Já tem conta?{" "}
                    <NextLink
                      href={ROUTES.LOGIN}
                      className="text-brm-primary hover:text-brm-secondary font-semibold transition-colors cursor-pointer"
                    >
                      Fazer Login
                    </NextLink>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-[10px] text-brm-text-muted">
              <NextLink className="hover:text-brm-primary transition-colors uppercase cursor-pointer" href={ROUTES.ABOUT}>
                Sobre
              </NextLink>
              <span className="text-brm-primary/50">|</span>
              <NextLink className="hover:text-brm-primary transition-colors uppercase cursor-pointer" href={ROUTES.SUPPORT}>
                Suporte
              </NextLink>
              <span className="text-brm-primary/50">|</span>
              <span className="uppercase">© 2026</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
