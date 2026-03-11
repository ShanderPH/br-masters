"use client";

import type { Session } from "@supabase/supabase-js";

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
    const supabase = getSupabaseClient();
    const { id, password } = credentials;

    if (!id || !password) {
      return {
        success: false,
        error: "ID e senha são obrigatórios",
      };
    }

    const formattedId = id.padStart(3, "0");

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_id", formattedId)
      .single();

    if (userError || !userRow) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("id", (userRow as User).id)
      .single();

    const email = (profileRow as { email: string } | null)?.email || `user${formattedId}@houseofguess.app`;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return {
        success: false,
        error: "Senha inválida",
      };
    }

    if (!authData.session) {
      return {
        success: false,
        error: "Falha ao criar sessão",
      };
    }

    const appUser = await fetchAppUser(authData.user.id);

    return {
      success: true,
      user: appUser ?? undefined,
      session: authData.session,
    };
  } catch (error) {
    console.error("Erro no login:", error);
    return {
      success: false,
      error: "Falha na autenticação. Tente novamente.",
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
