"use client";

import type { Session } from "@supabase/supabase-js";

import { backendLogin, buildSupabaseSession } from "@/lib/api/auth-client";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { User, UserProfile } from "@/lib/supabase/types";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface AppUser {
  id: string;
  username: string;
  firebase_id: string | null;
  role: string;
  favorite_team_id: string | null;
  profile: UserProfile;
}

export interface LoginCredentials {
  id: string;
  password: string;
}

export interface EmailLoginCredentials {
  email: string;
  password: string;
}

const GENERIC_LOGIN_ERROR = "Credenciais inválidas. Verifique seus dados e tente novamente.";

export interface LoginResponse {
  success: boolean;
  user?: AppUser;
  session?: Session;
  error?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

async function fetchAppUser(authUserId: string): Promise<AppUser | null> {
  const supabase = getSupabaseClient();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUserId)
    .single();

  if (userError || !userRow) return null;

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", authUserId)
    .single();

  if (profileError || !profile) return null;

  return {
    id: (userRow as User).id,
    username: (userRow as User).username,
    firebase_id: (userRow as User).firebase_id,
    role: (userRow as User).role,
    favorite_team_id: (userRow as User).favorite_team_id,
    profile,
  };
}

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

export async function signIn(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const { id, password } = credentials;

    if (!id || !password) {
      return {
        success: false,
        error: "ID e senha são obrigatórios",
      };
    }

    const formattedId = id.padStart(3, "0");

    const result = await backendLogin({ identifier: formattedId, password });

    if (!result.success || !result.user || !result.session) {
      return {
        success: false,
        error: result.error ?? GENERIC_LOGIN_ERROR,
      };
    }

    const supabase = getSupabaseClient();
    const session = buildSupabaseSession(result.session);

    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (setSessionError) {
      return {
        success: false,
        error: "Falha ao criar sessão",
      };
    }

    return {
      success: true,
      user: result.user,
      session,
    };
  } catch (error) {
    console.error("Erro no login:", error);
    return {
      success: false,
      error: "Falha na autenticação. Tente novamente.",
    };
  }
}

export async function signInWithEmail(credentials: EmailLoginCredentials): Promise<LoginResponse> {
  try {
    const { email, password } = credentials;

    if (!email || !password) {
      return {
        success: false,
        error: "E-mail e senha são obrigatórios",
      };
    }

    const result = await backendLogin({ email, password });

    if (!result.success || !result.user || !result.session) {
      return {
        success: false,
        error: result.error ?? GENERIC_LOGIN_ERROR,
      };
    }

    const supabase = getSupabaseClient();
    const session = buildSupabaseSession(result.session);

    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (setSessionError) {
      return {
        success: false,
        error: "Falha ao criar sessão",
      };
    }

    return {
      success: true,
      user: result.user,
      session,
    };
  } catch (error) {
    console.error("Erro no login por e-mail:", error);
    return {
      success: false,
      error: GENERIC_LOGIN_ERROR,
    };
  }
}

export async function signOut(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Erro no logout:", error);
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return null;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return fetchAppUser(user.id);
  } catch (error) {
    console.error("Erro ao buscar usuário atual:", error);
    return null;
  }
}

export function onAuthStateChange(callback: (user: AppUser | null) => void) {
  const supabase = getSupabaseClient();
  
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const appUser = await fetchAppUser(session.user.id);
      callback(appUser);
    } else {
      callback(null);
    }
  });
}

export async function checkExistingSession(): Promise<LoginResponse> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        error: "Nenhuma sessão válida encontrada",
      };
    }

    const appUser = await fetchAppUser(session.user.id);

    if (appUser) {
      return {
        success: true,
        user: appUser,
        session,
      };
    }

    return {
      success: false,
      error: "Nenhuma sessão válida encontrada",
    };
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return {
      success: false,
      error: "Erro ao verificar sessão",
    };
  }
}
