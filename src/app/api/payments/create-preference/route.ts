import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  createDepositPreference,
  type DepositCategory,
} from "@/lib/services/mercadopago";

const CATEGORY_LABELS: Record<DepositCategory, string> = {
  tournament_prize: "Premiação por Torneio",
  round_prize: "Premiação por Rodada",
  match_prize: "Premiação por Partida",
};

const MIN_DEPOSIT = 5;
const MAX_DEPOSIT = 5000;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, category } = body as {
      amount: number;
      category: DepositCategory;
    };

    if (!amount || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
      return NextResponse.json(
        {
          error: `Valor deve ser entre R$ ${MIN_DEPOSIT},00 e R$ ${MAX_DEPOSIT},00`,
        },
        { status: 400 }
      );
    }

    if (!category || !CATEGORY_LABELS[category]) {
      return NextResponse.json(
        { error: "Categoria de depósito inválida" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();

    type ProfileRow = {
      first_name: string;
      last_name: string | null;
      email: string;
    };

    const profileData = profile as ProfileRow | null;

    if (!profileData) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    const transactionId = randomUUID();

    const categoryLabel = CATEGORY_LABELS[category];

    // Use service client if available (bypasses RLS), otherwise fall back to regular client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbClient: any;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      dbClient = createServiceClient();
    } else {
      dbClient = supabase;
      console.warn("[Payments] SUPABASE_SERVICE_ROLE_KEY not set, using regular client");
    }

    const { error: txError } = await dbClient
      .from("transactions")
      .insert({
        id: transactionId,
        user_id: user.id,
        amount,
        currency: "BRL",
        type: "deposit",
        status: "pending",
        description: `Depósito - ${categoryLabel}`,
        payment_method: "mercadopago",
        metadata: {
          category,
          category_label: categoryLabel,
          payment_provider: "mercadopago",
        },
      });

    if (txError) {
      console.error("[Payments] Error creating transaction:", txError);
      return NextResponse.json(
        { error: "Erro ao registrar transação" },
        { status: 500 }
      );
    }

    const userName = `${profileData.first_name}${profileData.last_name ? ` ${profileData.last_name}` : ""}`;

    const preference = await createDepositPreference({
      userId: user.id,
      userEmail: profileData.email,
      userName,
      amount,
      category,
      categoryLabel,
      transactionId,
    });

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      transactionId,
    });
  } catch (error) {
    console.error("[Payments] Error creating preference:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar preferência de pagamento",
      },
      { status: 500 }
    );
  }
}
