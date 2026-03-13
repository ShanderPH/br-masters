"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { ButtonLoadingDots } from "@/components/ui/button-loading-dots";
import { Lock, Eye, EyeOff, LogIn, HelpCircle, UserPlus, User, Mail, AlertCircle } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { BRMLogo } from "@/components/ui/brm-logo";
import { UserSearchInput, type UserSuggestion } from "@/components/auth/user-search-input";
import { ROUTES } from "@/lib/routes";

type AuthMethod = "username" | "email";

interface LoginScreenProps {
  onLoginByUsername?: (userId: string, password: string) => void;
  onLoginByEmail?: (email: string, password: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginScreen({
  onLoginByUsername,
  onLoginByEmail,
  isLoading = false,
  error = null,
}: LoginScreenProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>("username");
  const [usernameInput, setUsernameInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    if (authMethod === "username" && onLoginByUsername) {
      const credential = selectedUser?.firebase_id || usernameInput.trim();
      if (!credential) return;
      onLoginByUsername(credential, password);
    } else if (authMethod === "email" && onLoginByEmail && emailInput.trim()) {
      onLoginByEmail(emailInput.trim(), password);
    }
  };

  const hasValidUsernameCredential =
    !!selectedUser || /^\d+$/.test(usernameInput.trim());

  const isSubmitDisabled =
    isLoading ||
    !password ||
    (authMethod === "username" && !hasValidUsernameCredential) ||
    (authMethod === "email" && !emailInput.trim());

  const handleTabSwitch = (method: AuthMethod) => {
    setAuthMethod(method);
    setPassword("");
    setSelectedUser(null);
  };

  const renderAuthTabs = (size: "sm" | "md") => {
    const isSmall = size === "sm";
    return (
      <div className="flex mb-4">
        <button
          type="button"
          onClick={() => handleTabSwitch("username")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${isSmall ? "text-xs" : "text-sm"} font-display font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            authMethod === "username"
              ? "text-brm-primary border-brm-primary"
              : "text-brm-text-muted border-transparent hover:text-brm-text-secondary"
          }`}
        >
          <User className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
          Usuário
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch("email")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${isSmall ? "text-xs" : "text-sm"} font-display font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            authMethod === "email"
              ? "text-brm-primary border-brm-primary"
              : "text-brm-text-muted border-transparent hover:text-brm-text-secondary"
          }`}
        >
          <Mail className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
          E-mail
        </button>
      </div>
    );
  };

  const renderIdentityField = (size: "sm" | "md") => {
    const isSmall = size === "sm";
    const iconClass = isSmall
      ? "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary"
      : "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brm-text-secondary";
    const inputClass = `w-full ${isSmall ? "pl-10 pr-4" : "pl-12 pr-4"} py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent transition-all hover:bg-white/15 hover:border-brm-primary/50 rounded-none`;

    if (authMethod === "username") {
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
            ID do Palpiteiro
          </label>
          <UserSearchInput
            value={usernameInput}
            onChange={setUsernameInput}
            onUserSelect={setSelectedUser}
            selectedUser={selectedUser}
            placeholder="Digite seu nome ou ID (ex: 001)"
            disabled={isLoading}
          />
          <p className="text-[11px] text-brm-text-muted">
            Digite seu nome ou ID e selecione o perfil para entrar.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
          E-mail
        </label>
        <div className="relative">
          <Mail className={iconClass} />
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="seu@email.com"
            disabled={isLoading}
            autoComplete="off"
            name={`brm-email-${size}`}
            className={inputClass}
          />
        </div>
      </div>
    );
  };

  const renderPasswordField = (size: "sm" | "md") => {
    const isSmall = size === "sm";
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
          Senha
        </label>
        <div className="relative">
          <Lock
            className={
              isSmall
                ? "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary"
                : "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brm-text-secondary"
            }
          />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            disabled={isLoading}
            autoComplete="new-password"
            name={`brm-password-${size}`}
            className={`w-full ${isSmall ? "pl-10 pr-10" : "pl-12 pr-12"} py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent transition-all hover:bg-white/15 hover:border-brm-primary/50 rounded-none`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute ${isSmall ? "right-3" : "right-4"} top-1/2 -translate-y-1/2 text-brm-text-muted hover:text-brm-primary transition-colors cursor-pointer`}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className={isSmall ? "w-4 h-4" : "w-5 h-5"} />
            ) : (
              <Eye className={isSmall ? "w-4 h-4" : "w-5 h-5"} />
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderError = () => (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div
          key="error"
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
  );

  const renderSubmitButton = (size: "sm" | "md") => (
    <Button
      type="submit"
      fullWidth
      isDisabled={isSubmitDisabled}
      isPending={isLoading}
      className="h-12 bg-linear-to-r from-brm-primary to-brm-primary/80 hover:from-brm-primary/90 hover:to-brm-primary text-brm-background font-bold uppercase tracking-wider shadow-lg shadow-brm-primary/30 transition-all duration-200 rounded-none"
      style={{ clipPath: "polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)" }}
    >
      {({ isPending }) => (
        <>
          {isPending ? (
            <ButtonLoadingDots size={size} color="current" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span className="ml-2">Entrar</span>
            </>
          )}
        </>
      )}
    </Button>
  );

  const renderFooterLinks = (size: "sm" | "md") => {
    const isSmall = size === "sm";
    return (
      <div className={`${isSmall ? "mt-5 pt-4" : "mt-6 pt-5"} border-t border-white/10`}>
        <div className={`flex items-center justify-between ${isSmall ? "text-xs" : "text-sm"}`}>
          <NextLink
            href={ROUTES.FORGOT_PASSWORD}
            className={`flex items-center ${isSmall ? "gap-1.5" : "gap-2"} text-brm-text-secondary hover:text-brm-primary transition-colors cursor-pointer`}
          >
            <HelpCircle className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
            Esqueci senha
          </NextLink>
          <NextLink
            href={ROUTES.REGISTER}
            className={`flex items-center ${isSmall ? "gap-1.5" : "gap-2"} text-brm-primary hover:text-brm-secondary font-semibold transition-colors uppercase tracking-wide cursor-pointer`}
          >
            <UserPlus className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
            Criar conta
          </NextLink>
        </div>
      </div>
    );
  };

  const renderPageFooter = () => (
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
  );

  return (
    <div className="relative min-h-screen overflow-y-auto">
      {/* ========== BACKGROUND WITH SHADERS ========== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/images/arrascaeta_background.png"
          alt="BR Masters Background"
          fill
          className="object-cover object-top"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-brm-background/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(26,26,46,0.7)_70%,rgba(26,26,46,0.95)_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-brm-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 md:h-32 bg-linear-to-t from-brm-background via-brm-background/80 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brm-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brm-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brm-accent/5 rounded-full blur-3xl" />
      </div>

      {/* ========== MOBILE LAYOUT ========== */}
      <div className="lg:hidden relative z-10 min-h-screen flex flex-col items-center justify-start sm:justify-center px-4 py-6 safe-area-inset">
        <div className="w-full max-w-sm flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-4"
          >
            <div className="drop-shadow-[0_0_30px_rgba(37,184,184,0.4)]">
              <BRMLogo size="sm" animated showText />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full pb-4"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-linear-to-b from-brm-primary/30 via-brm-primary/10 to-transparent opacity-50 blur-sm" />
              <div className="relative bg-white/5 backdrop-blur-xl backdrop-saturate-150 border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-10 bg-linear-to-b from-brm-primary via-brm-secondary to-brm-accent" />
                    <div>
                      <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                        Entrar
                      </h2>
                      <p className="text-brm-text-primary/80 text-xs">Acesse seus palpites</p>
                    </div>
                  </div>

                  {renderAuthTabs("sm")}

                  <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    {renderIdentityField("sm")}
                    {renderPasswordField("sm")}
                    {renderError()}
                    {renderSubmitButton("sm")}
                  </form>

                  {renderFooterLinks("sm")}
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
            {renderPageFooter()}
          </motion.div>
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden lg:flex relative z-10 min-h-screen flex-col items-center justify-center px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-3"
        >
          <div className="drop-shadow-[0_0_30px_rgba(37,184,184,0.4)]">
            <BRMLogo size="md" animated showText />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="flex max-w-5xl w-full min-h-[500px] max-h-[calc(100vh-96px)] shadow-2xl overflow-hidden"
        >
          <div className="relative w-[55%] overflow-hidden">
            <Image
              src="/images/wallpaper_brasileirao_2026.png"
              alt="Brasileirão 2026"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-brm-background/80 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(26,26,46,0.4)_100%)]" />
          </div>

          <div className="w-[45%] bg-white/5 backdrop-blur-xl backdrop-saturate-150 border-l border-white/10 flex flex-col justify-center overflow-y-auto custom-scrollbar">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-12 bg-linear-to-b from-brm-primary via-brm-secondary to-brm-accent" />
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                    Entrar
                  </h2>
                  <p className="text-brm-text-primary/80 text-sm">Acesse seus palpites</p>
                </div>
              </div>

              {renderAuthTabs("md")}

              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                {renderIdentityField("md")}
                {renderPasswordField("md")}
                {renderError()}
                {renderSubmitButton("md")}
              </form>

              {renderFooterLinks("md")}
            </div>

            <div className="px-8 pb-6">
              <div className="flex items-center justify-center gap-3 text-xs text-brm-text-muted">
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
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
