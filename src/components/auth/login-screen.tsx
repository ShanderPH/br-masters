"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { ButtonLoadingDots } from "@/components/ui/button-loading-dots";
import { Lock, Eye, EyeOff, LogIn, HelpCircle, UserPlus } from "lucide-react";
import Image from "next/image";
import { BRMLogo } from "@/components/ui/brm-logo";
import { UserSearchInput } from "./user-search-input";

interface SelectedUser {
  id: string;
  firebase_id: string;
  name: string;
  favorite_team_logo: string | null;
  avatar: string | null;
}

interface LoginScreenProps {
  onLogin?: (userId: string, password: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginScreen({ onLogin, isLoading = false, error = null }: LoginScreenProps) {
  const [userName, setUserName] = useState("");
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin && selectedUser && password) {
      onLogin(selectedUser.firebase_id, password);
    }
  };

  const handleUserSelect = (user: SelectedUser | null) => {
    setSelectedUser(user);
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* ========== BACKGROUND WITH SHADERS ========== */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/arrascaeta_background.png"
          alt="BR Masters Background"
          fill
          className="object-cover object-top"
          priority
          quality={90}
        />
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-brm-background/60" />
        
        {/* Radial gradient - focal point effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(26,26,46,0.7)_70%,rgba(26,26,46,0.95)_100%)]" />
        
        {/* Top shader gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-brm-background/80 to-transparent" />
        
        {/* Bottom shader gradient - stronger on mobile */}
        <div className="absolute bottom-0 left-0 right-0 h-48 md:h-32 bg-gradient-to-t from-brm-background via-brm-background/80 to-transparent" />
        
        {/* Animated glow accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brm-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brm-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brm-accent/5 rounded-full blur-3xl" />
      </div>

      {/* ========== MOBILE LAYOUT ========== */}
      <div className="lg:hidden relative z-10 h-full flex flex-col items-center justify-center px-4 py-6 safe-area-inset">
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Logo - Prominent on mobile */}
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

          {/* Login Card - Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <div className="relative">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-b from-brm-primary/30 via-brm-primary/10 to-transparent opacity-50 blur-sm" />
              
              {/* Glass card */}
              <div className="relative bg-white/5 backdrop-blur-xl backdrop-saturate-150 border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-10 bg-gradient-to-b from-brm-primary via-brm-secondary to-brm-accent" />
                    <div>
                      <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                        Entrar
                      </h2>
                      <p className="text-brm-text-primary/80 text-xs">
                        Acesse seus palpites
                      </p>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User Search */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        Palpiteiro
                      </label>
                      <UserSearchInput
                        value={userName}
                        onChange={setUserName}
                        onUserSelect={handleUserSelect}
                        selectedUser={selectedUser}
                        placeholder="Digite seu nome..."
                        disabled={isLoading}
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-secondary" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••"
                          disabled={isLoading}
                          className="w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent transition-all hover:bg-white/15 hover:border-brm-primary/50 rounded-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brm-text-muted hover:text-brm-primary transition-colors"
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-red-500/10 border-l-2 border-red-500 px-3 py-2 text-sm text-red-400"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      fullWidth
                      isDisabled={isLoading || !selectedUser || !password}
                      isPending={isLoading}
                      className="h-12 bg-gradient-to-r from-brm-primary to-brm-primary/80 hover:from-brm-primary/90 hover:to-brm-primary text-brm-background font-bold uppercase tracking-wider shadow-lg shadow-brm-primary/30 transition-all duration-200 rounded-none"
                      style={{ clipPath: "polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)" }}
                    >
                      {({ isPending }) => (
                        <>
                          {isPending ? (
                            <ButtonLoadingDots size="sm" color="current" />
                          ) : (
                            <>
                              <LogIn className="w-5 h-5" />
                              <span className="ml-2">Entrar</span>
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Footer links */}
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-brm-text-secondary hover:text-brm-primary transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Esqueci senha
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-brm-primary hover:text-brm-secondary font-semibold transition-colors uppercase tracking-wide cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Criar conta
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-[10px] text-brm-text-muted">
              <a className="hover:text-brm-primary transition-colors uppercase" href="/about">Sobre</a>
              <span className="text-brm-primary/50">|</span>
              <a className="hover:text-brm-primary transition-colors uppercase" href="mailto:suporte@brmasters.com.br">Suporte</a>
              <span className="text-brm-primary/50">|</span>
              <span className="uppercase">© 2026</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden lg:flex relative z-10 h-full flex-col items-center justify-center px-8">
        {/* Logo at top - smaller */}
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

        {/* Wallpaper + Form Card - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="flex max-w-5xl w-full h-[460px] shadow-2xl overflow-hidden"
        >
          {/* Wallpaper Side */}
          <div className="relative w-[55%] overflow-hidden">
            <Image
              src="/images/wallpaper_brasileirao_2026.png"
              alt="Brasileirão 2026"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Gradient overlay for transition to form */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-brm-background/80 pointer-events-none" />
            
            {/* Subtle vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(26,26,46,0.4)_100%)]" />
          </div>

          {/* Form Side - Glass effect */}
          <div className="w-[45%] bg-white/5 backdrop-blur-xl backdrop-saturate-150 border-l border-white/10 flex flex-col justify-center">
            <div className="p-8">
              {/* Card Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-12 bg-gradient-to-b from-brm-primary via-brm-secondary to-brm-accent" />
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                    Entrar
                  </h2>
                  <p className="text-brm-text-primary/80 text-sm">
                    Acesse seus palpites
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* User Search */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                    Palpiteiro
                  </label>
                  <UserSearchInput
                    value={userName}
                    onChange={setUserName}
                    onUserSelect={handleUserSelect}
                    selectedUser={selectedUser}
                    placeholder="Digite seu nome..."
                    disabled={isLoading}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brm-text-primary uppercase tracking-wider">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brm-text-secondary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      disabled={isLoading}
                      className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent transition-all hover:bg-white/15 hover:border-brm-primary/50 rounded-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brm-text-muted hover:text-brm-primary transition-colors"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-500/10 border-l-2 border-red-500 px-3 py-2 text-sm text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  isDisabled={isLoading || !selectedUser || !password}
                  isPending={isLoading}
                  className="h-12 bg-gradient-to-r from-brm-primary to-brm-primary/80 hover:from-brm-primary/90 hover:to-brm-primary text-brm-background font-bold uppercase tracking-wider shadow-lg shadow-brm-primary/30 transition-all duration-200 rounded-none"
                  style={{ clipPath: "polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)" }}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? (
                        <ButtonLoadingDots size="md" color="current" />
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          <span className="ml-2">Entrar</span>
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>

              {/* Footer links */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-brm-text-secondary hover:text-brm-primary transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Esqueci senha
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-brm-primary hover:text-brm-secondary font-semibold transition-colors uppercase tracking-wide cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Criar conta
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Footer */}
            <div className="px-8 pb-6">
              <div className="flex items-center justify-center gap-3 text-xs text-brm-text-muted">
                <a className="hover:text-brm-primary transition-colors uppercase" href="/about">Sobre</a>
                <span className="text-brm-primary/50">|</span>
                <a className="hover:text-brm-primary transition-colors uppercase" href="mailto:suporte@brmasters.com.br">Suporte</a>
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
