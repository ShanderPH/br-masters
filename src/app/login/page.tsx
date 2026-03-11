"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { LoginScreen } from "@/components/auth/login-screen";
import { PageLoading } from "@/components/ui/page-loading";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginStarted, setLoginStarted] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = useCallback(async (userId: string, password: string) => {
    setLoginStarted(true);
    setIsLoading(true);
    setError(null);

    try {
      const result = await login({ id: userId, password });

      if (result.success) {
        setIsRedirecting(true);
        router.push("/dashboard");
      } else {
        setError(result.error || "Erro ao fazer login. Tente novamente.");
        setIsLoading(false);
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  }, [login, router]);

  const showInitialLoading = authLoading && !loginStarted;
  const showRedirecting = isRedirecting || (isAuthenticated && !loginStarted);

  if (showInitialLoading || showRedirecting) {
    const message = showRedirecting ? "Entrando..." : "Verificando sessão...";

    return (
      <AnimatePresence mode="wait">
        <PageLoading isVisible={true} message={message} />
      </AnimatePresence>
    );
  }

  return (
    <LoginScreen
      onLogin={handleLogin}
      isLoading={isLoading}
      error={error}
    />
  );
}
