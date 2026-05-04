import type { Session } from "@supabase/supabase-js";

import { apiFetch } from "@/lib/api/client";
import type { AppUser } from "@/lib/auth/auth-service";

export interface BackendLoginRequest {
  email?: string;
  identifier?: string;
  password: string;
}

export interface BackendSessionPayload {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  provider_token?: string;
  provider_refresh_token?: string;
}

export interface BackendLoginResponse {
  success: boolean;
  user?: AppUser;
  session?: BackendSessionPayload;
  error?: string;
}

export async function backendLogin(
  payload: BackendLoginRequest
): Promise<BackendLoginResponse> {
  const response = await apiFetch<BackendLoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return {
      success: false,
      error: response.data?.error ?? "Credenciais inválidas. Verifique seus dados e tente novamente.",
    };
  }

  return response.data;
}

export async function backendMe(token: string): Promise<AppUser | null> {
  const response = await apiFetch<AppUser>("/api/v1/auth/me", {
    method: "GET",
    token,
  });

  if (!response.ok) {
    return null;
  }

  return response.data;
}

export function buildSupabaseSession(backendSession: BackendSessionPayload): Session {
  return {
    access_token: backendSession.access_token,
    refresh_token: backendSession.refresh_token,
    expires_in: backendSession.expires_in,
    token_type: backendSession.token_type,
    expires_at: Math.floor(Date.now() / 1000) + backendSession.expires_in,
    user: {
      id: "",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  } as Session;
}
