"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { LoginScreen } from "@/components/auth/login-screen";
import { PageLoading } from "@/components/ui/page-loading";
import { useAuth } from "@/hooks/use-auth";
import { useLoginRateLimit } from "@/hooks/use-login-rate-limit";
import { ROUTES } from "@/lib/routes";
import { ERROR_MESSAGES } from "@/lib/error-messages";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithEmail, isAuthenticated, isLoading: authLoading } = useAuth();
  const rateLimit = useLoginRateLimit();
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginStarted, setLoginStarted] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLoginByUsername = useCallback(async (userId: string, password: string) => {
    if (rateLimit.isLocked) return;

    setLoginStarted(true);
    setIsLoading(true);
    setError(null);

    try {
      const result = await login({ id: userId, password });

      if (result.success) {
        rateLimit.reset();
        setIsRedirecting(true);
        router.push(ROUTES.DASHBOARD);
      } else {
        rateLimit.recordFailure();
        setError(ERROR_MESSAGES.AUTH.GENERIC_LOGIN_ERROR);
        setIsLoading(false);
      }
    } catch {
      rateLimit.recordFailure();
      setError(ERROR_MESSAGES.AUTH.GENERIC_LOGIN_ERROR);
      setIsLoading(false);
    }
  }, [login, router, rateLimit]);

  const handleLoginByEmail = useCallback(async (email: string, password: string) => {
    if (rateLimit.isLocked) return;

    setLoginStarted(true);
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginWithEmail({ email, password });

      if (result.success) {
        rateLimit.reset();
        setIsRedirecting(true);
        router.push(ROUTES.DASHBOARD);
      } else {
        rateLimit.recordFailure();
        setError(ERROR_MESSAGES.AUTH.GENERIC_LOGIN_ERROR);
        setIsLoading(false);
      }
    } catch {
      rateLimit.recordFailure();
      setError(ERROR_MESSAGES.AUTH.GENERIC_LOGIN_ERROR);
      setIsLoading(false);
    }
  }, [loginWithEmail, router, rateLimit]);

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

  const displayError = rateLimit.warningMessage || error;

  return (
    <LoginScreen
      onLoginByUsername={handleLoginByUsername}
      onLoginByEmail={handleLoginByEmail}
      isLoading={isLoading || rateLimit.isLocked}
      error={displayError}
    />
  );
}
