"use client";

import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/supabase/types";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface LoginCredentials {
  id: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: UserProfile;
  session?: Session;
  error?: string;
}

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

/**
 * Login usando Firebase ID (001-011) e senha numérica
 */
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

    // Buscar perfil do usuário pelo firebase_id
    const { data: profile, error: profileError } = await supabase
      .from("users_profiles")
      .select("*")
      .eq("firebase_id", formattedId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    // Email temporário baseado no firebase_id (mantendo compatibilidade com projeto legado)
    const email = `user${formattedId}@houseofguess.app`;

    // Fazer login no Supabase Auth
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

    return {
      success: true,
      user: profile,
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

/**
 * Logout
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Erro no logout:", error);
  }
}

/**
 * Obter usuário atual
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("users_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile;
  } catch (error) {
    console.error("Erro ao buscar usuário atual:", error);
    return null;
  }
}

/**
 * Listener para mudanças no estado de autenticação
 */
export function onAuthStateChange(callback: (user: UserProfile | null) => void) {
  const supabase = getSupabaseClient();
  
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await getCurrentUser();
      callback(profile);
    } else {
      callback(null);
    }
  });
}

/**
 * Verificar sessão existente
 */
export async function checkExistingSession(): Promise<LoginResponse> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = await getCurrentUser();

    if (user && session) {
      return {
        success: true,
        user,
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
