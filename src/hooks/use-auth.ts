"use client";

import { useState, useEffect, useCallback } from "react";

import {
  signIn,
  signInWithEmail,
  signOut,
  getCurrentUser,
  checkExistingSession,
  onAuthStateChange,
  type AppUser,
  type LoginCredentials,
  type EmailLoginCredentials,
  type LoginResponse,
} from "@/lib/auth";

interface UseAuthReturn {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  loginWithEmail: (credentials: EmailLoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await checkExistingSession();
        if (result.success && result.user) {
          setUser(result.user);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = onAuthStateChange((appUser) => {
      setUser(appUser);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const result = await signIn(credentials);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmailFn = useCallback(async (credentials: EmailLoginCredentials): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const result = await signInWithEmail(credentials);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const appUser = await getCurrentUser();
    setUser(appUser);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    loginWithEmail: loginWithEmailFn,
    logout,
    refreshUser,
  };
}
