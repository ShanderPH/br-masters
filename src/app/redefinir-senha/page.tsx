"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NextLink from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { Button } from "@heroui/react";

import { BRMLogo } from "@/components/ui/brm-logo";
import { ButtonLoadingDots } from "@/components/ui/button-loading-dots";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/routes";

type RecoveryMode = "request" | "update";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [mode, setMode] = useState<RecoveryMode>("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const detectRecoveryMode = () => {
      const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
      const isRecoveryLink =
        hashParams.get("type") === "recovery" || hashParams.has("access_token");

      if (isRecoveryLink) {
        setMode("update");
      }
    };

    detectRecoveryMode();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!updateSuccess) return;

    const timer = window.setTimeout(() => {
      router.push(ROUTES.LOGIN);
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [router, updateSuccess]);

  const hasStrongPassword = useMemo(() => {
    if (!newPassword) return false;
    return newPassword.length >= 6 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  }, [newPassword]);

  const handleRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setRequestSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Digite um e-mail válido para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}${ROUTES.FORGOT_PASSWORD}`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo }
      );

      if (resetError) {
        setError("Não foi possível enviar o link de recuperação. Tente novamente.");
        return;
      }

      setRequestSuccess(true);
    } catch {
      setError("Não foi possível enviar o link de recuperação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!hasStrongPassword) {
      setError("A nova senha precisa ter no mínimo 6 caracteres, 1 letra maiúscula e 1 número.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação de senha não confere.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError("Não foi possível atualizar sua senha. Solicite um novo link e tente novamente.");
        return;
      }

      setUpdateSuccess(true);
    } catch {
      setError("Não foi possível atualizar sua senha. Solicite um novo link e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start sm:justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-5"
          >
            <BRMLogo size="sm" animated showText />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-linear-to-b from-brm-primary/30 via-brm-primary/10 to-transparent opacity-50 blur-sm" />
            <div className="relative bg-white/5 backdrop-blur-xl backdrop-saturate-150 border border-white/10 shadow-2xl overflow-hidden p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="font-display font-black text-lg text-white uppercase tracking-wide">
                  {mode === "request" ? "Recuperar Senha" : "Nova Senha"}
                </h1>
                <NextLink
                  href={ROUTES.LOGIN}
                  className="text-brm-text-secondary hover:text-brm-primary transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </NextLink>
              </div>

              {mode === "request" ? (
                <>
                  <p className="text-sm text-brm-text-secondary">
                    Informe seu e-mail para receber o link de recuperação.
                  </p>

                  {requestSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-300">
                      Link enviado. Verifique sua caixa de entrada e clique no botão para redefinir sua senha.
                    </div>
                  )}

                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        E-mail
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="seu@email.com"
                          disabled={isSubmitting}
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                        />
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          key="recovery-request-error"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
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
                    >
                      {({ isPending }) =>
                        isPending ? (
                          <ButtonLoadingDots size="sm" color="current" />
                        ) : (
                          <span>Enviar Link</span>
                        )
                      }
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-sm text-brm-text-secondary">
                    Defina uma nova senha para concluir a recuperação da conta.
                  </p>

                  {updateSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-300 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Senha atualizada com sucesso. Redirecionando para o login...
                    </div>
                  )}

                  <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        Nova Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          placeholder="••••••"
                          disabled={isSubmitting}
                          className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brm-text-muted hover:text-brm-primary transition-colors cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        Confirmar Nova Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="••••••"
                          disabled={isSubmitting}
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
                    </div>

                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          key="recovery-update-error"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
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
                      isDisabled={isSubmitting || updateSuccess}
                      isPending={isSubmitting}
                      className="h-12 bg-linear-to-r from-brm-primary to-brm-primary/80 hover:from-brm-primary/90 hover:to-brm-primary text-brm-background font-bold uppercase tracking-wider shadow-lg shadow-brm-primary/30 transition-all duration-200 rounded-none"
                    >
                      {({ isPending }) =>
                        isPending ? (
                          <ButtonLoadingDots size="sm" color="current" />
                        ) : (
                          <span>Salvar Nova Senha</span>
                        )
                      }
                    </Button>
                  </form>
                </>
              )}

              <div className="pt-2 border-t border-white/10 text-center text-xs text-brm-text-muted">
                <NextLink
                  href={ROUTES.LOGIN}
                  className="hover:text-brm-primary transition-colors uppercase cursor-pointer"
                >
                  Voltar ao Login
                </NextLink>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
