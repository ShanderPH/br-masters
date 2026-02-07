"use client";

import { useState, useEffect, useRef } from "react";
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
  const hasRedirected = useRef(false);

  // Redirect if already authenticated - use ref to avoid setState in effect
  useEffect(() => {
    if (isAuthenticated && !authLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async (userId: string, password: string) => {
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
  };

  // Derive loading state: show during auth check, when authenticated, or during redirect
  const showPageLoading = authLoading || isAuthenticated || isRedirecting;

  if (showPageLoading) {
    const message = isRedirecting 
      ? "Entrando..." 
      : isAuthenticated 
        ? "Redirecionando..." 
        : "Verificando sessão...";
    
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
