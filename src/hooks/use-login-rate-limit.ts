"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface RateLimitState {
  failedAttempts: number;
  lockedUntil: number | null;
  remainingSeconds: number;
  isLocked: boolean;
  warningMessage: string | null;
}

interface UseLoginRateLimitReturn extends RateLimitState {
  recordFailure: () => void;
  reset: () => void;
}

const TIER_1_ATTEMPTS = 5;
const TIER_1_LOCKOUT_SECONDS = 30;
const TIER_2_ATTEMPTS = 10;
const TIER_2_LOCKOUT_SECONDS = 120;

export function useLoginRateLimit(): UseLoginRateLimitReturn {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = remainingSeconds > 0;

  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setLockedUntil(null);
      }
    };

    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [lockedUntil]);

  const recordFailure = useCallback(() => {
    setFailedAttempts((prev) => {
      const next = prev + 1;

      if (next >= TIER_2_ATTEMPTS) {
        setLockedUntil(Date.now() + TIER_2_LOCKOUT_SECONDS * 1000);
      } else if (next >= TIER_1_ATTEMPTS) {
        setLockedUntil(Date.now() + TIER_1_LOCKOUT_SECONDS * 1000);
      }

      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setFailedAttempts(0);
    setLockedUntil(null);
    setRemainingSeconds(0);
  }, []);

  let warningMessage: string | null = null;
  if (isLocked) {
    if (failedAttempts >= TIER_2_ATTEMPTS) {
      warningMessage = `Conta temporariamente bloqueada. Tente novamente em ${remainingSeconds}s.`;
    } else {
      warningMessage = `Muitas tentativas. Aguarde ${remainingSeconds}s antes de tentar novamente.`;
    }
  } else if (failedAttempts >= TIER_1_ATTEMPTS - 1 && failedAttempts < TIER_1_ATTEMPTS) {
    warningMessage = "Atenção: mais uma tentativa incorreta e o login será bloqueado temporariamente.";
  }

  return {
    failedAttempts,
    lockedUntil,
    remainingSeconds,
    isLocked,
    warningMessage,
    recordFailure,
    reset,
  };
}
