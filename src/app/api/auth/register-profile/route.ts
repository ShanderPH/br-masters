import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createServiceClient>;

const AVATAR_BUCKET = "user-avatars";
const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;

async function upsertViaRest(
  table: "users" | "user_profiles",
  payload: Record<string, unknown>
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return "Configuração do servidor incompleta para salvar cadastro";
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?on_conflict=id`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([payload]),
    }
  );

  if (response.ok) {
    return null;
  }

  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message || body.error || `Falha ao salvar dados em ${table}`;
  } catch {
    return `Falha ao salvar dados em ${table}`;
  }
}

const completeProfileSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  favoriteTeamId: z.string().uuid(),
  whatsapp: z.string().trim().min(10),
  cpf: z.string().trim().optional(),
});

function getUsernameBase(firstName: string, lastName: string): string {
  const merged = `${firstName.trim()}_${lastName.trim()}`.toLowerCase();
  const normalized = merged.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sanitized = normalized.replace(/[^a-z0-9_]/g, "").replace(/_+/g, "_");
  return sanitized.slice(0, 20) || "palpiteiro";
}

async function buildUniqueUsername(
  supabase: ServiceClient,
  firstName: string,
  lastName: string,
  userId: string
): Promise<string> {
  const base = getUsernameBase(firstName, lastName);
  let candidate = `${base}_${userId.slice(0, 6)}`.slice(0, 30);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data: found } = await supabase
      .from("users")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();

    const row = found as { id: string } | null;
    if (!row || row.id === userId) {
      return candidate;
    }

    candidate = `${base}_${userId.slice(0, 4)}${attempt + 1}`.slice(0, 30);
  }

  return `${base}_${crypto.randomUUID().slice(0, 6)}`.slice(0, 30);
}

async function generateFirebaseId(
  supabase: ServiceClient
): Promise<string> {
  const { data } = await supabase.from("users").select("firebase_id");

  const rows = (data as Array<{ firebase_id: string | null }> | null) ?? [];
  const used = new Set(rows.map((row) => row.firebase_id).filter((id): id is string => !!id));

  let next = 1;
  while (used.has(String(next).padStart(3, "0"))) {
    next += 1;
  }

  return String(next).padStart(3, "0");
}

async function ensureAvatarBucket(supabase: ServiceClient) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets ?? []).some((bucket) => bucket.name === AVATAR_BUCKET);

  if (exists) {
    return;
  }

  await supabase.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: `${AVATAR_MAX_SIZE_BYTES}`,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const payload = {
      userId: String(formData.get("userId") ?? "").trim(),
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      favoriteTeamId: String(formData.get("favoriteTeamId") ?? "").trim(),
      whatsapp: String(formData.get("whatsapp") ?? "").replace(/\D/g, ""),
      cpf:
        String(formData.get("cpf") ?? "")
          .replace(/\D/g, "")
          .trim() || undefined,
    };

    const parsed = completeProfileSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: authUserResult, error: authUserError } = await supabase.auth.admin.getUserById(
      parsed.data.userId
    );

    if (authUserError || !authUserResult.user) {
      return NextResponse.json({ error: "Usuário inválido" }, { status: 400 });
    }

    if ((authUserResult.user.email ?? "").toLowerCase() !== parsed.data.email) {
      return NextResponse.json(
        { error: "Os dados da conta não conferem" },
        { status: 400 }
      );
    }

    const { data: teamRow } = await supabase
      .from("teams")
      .select("id")
      .eq("id", parsed.data.favoriteTeamId)
      .maybeSingle();

    if (!teamRow) {
      return NextResponse.json(
        { error: "Time selecionado inválido" },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("firebase_id")
      .eq("id", parsed.data.userId)
      .maybeSingle();

    const existingUserRow = existingUser as { firebase_id: string | null } | null;
    const firebaseId = existingUserRow?.firebase_id ?? (await generateFirebaseId(supabase));
    const username = await buildUniqueUsername(
      supabase,
      parsed.data.firstName,
      parsed.data.lastName,
      parsed.data.userId
    );

    const userPayload = {
      id: parsed.data.userId,
      username,
      favorite_team_id: parsed.data.favoriteTeamId,
      firebase_id: firebaseId,
    };

    const userError = await upsertViaRest("users", userPayload);
    if (userError) {
      return NextResponse.json(
        { error: "Não foi possível salvar os dados do usuário" },
        { status: 500 }
      );
    }

    let avatarUrl: string | null = null;

    const avatarCandidate = formData.get("avatar");
    if (avatarCandidate instanceof File && avatarCandidate.size > 0) {
      if (!avatarCandidate.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Avatar deve ser um arquivo de imagem" },
          { status: 400 }
        );
      }

      if (avatarCandidate.size > AVATAR_MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Avatar deve ter no máximo 2MB" },
          { status: 400 }
        );
      }

      await ensureAvatarBucket(supabase);

      const extension = avatarCandidate.name.split(".").pop()?.toLowerCase() || "jpg";
      const avatarPath = `${parsed.data.userId}/${crypto.randomUUID()}.${extension}`;
      const buffer = Buffer.from(await avatarCandidate.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(avatarPath, buffer, {
          contentType: avatarCandidate.type,
          upsert: true,
          cacheControl: "3600",
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(avatarPath);
        avatarUrl = urlData.publicUrl;
      }
    }

    const profilePreferences = parsed.data.cpf
      ? { cpf: parsed.data.cpf }
      : {};

    const profilePayload = {
      id: parsed.data.userId,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
      preferences: profilePreferences,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    };

    const profileError = await upsertViaRest("user_profiles", profilePayload);
    if (profileError) {
      return NextResponse.json(
        { error: "Não foi possível salvar o perfil" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      firebaseId,
    });
  } catch {
    return NextResponse.json(
      { error: "Falha ao concluir cadastro" },
      { status: 500 }
    );
  }
}
