import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  createCardPayment,
  createPixPayment,
  type DepositCategory,
} from "@/lib/services/mercadopago";

const CATEGORY_LABELS: Record<DepositCategory, string> = {
  tournament_prize: "Premiação por Torneio",
  round_prize: "Premiação por Rodada",
  match_prize: "Premiação por Partida",
};

const MIN_DEPOSIT = 5;
const MAX_DEPOSIT = 5000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDbClient(fallback: any) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServiceClient();
  }
  return fallback;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      category,
      paymentMethod,
      token,
      paymentMethodId,
      installments,
      issuerId,
      payerEmail,
      payerFirstName,
      payerLastName,
      payerDocType,
      payerDocNumber,
    } = body as {
      amount: number;
      category: DepositCategory;
      paymentMethod: "card" | "pix";
      token?: string;
      paymentMethodId?: string;
      installments?: number;
      issuerId?: string;
      payerEmail?: string;
      payerFirstName?: string;
      payerLastName?: string;
      payerDocType?: string;
      payerDocNumber?: string;
    };

    if (!amount || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
      return NextResponse.json(
        { error: `Valor deve ser entre R$ ${MIN_DEPOSIT},00 e R$ ${MAX_DEPOSIT},00` },
        { status: 400 }
      );
    }

    if (!category || !CATEGORY_LABELS[category]) {
      return NextResponse.json(
        { error: "Categoria de depósito inválida" },
        { status: 400 }
      );
    }

    if (!paymentMethod || !["card", "pix"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Método de pagamento inválido" },
        { status: 400 }
      );
    }

    if (paymentMethod === "card" && (!token || !paymentMethodId)) {
      return NextResponse.json(
        { error: "Token e método de pagamento são obrigatórios para cartão" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();

    type ProfileRow = { first_name: string; last_name: string | null; email: string };
    const profileData = profile as ProfileRow | null;

    if (!profileData) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const transactionId = randomUUID();
    const categoryLabel = CATEGORY_LABELS[category];
    const description = `BR Masters - ${categoryLabel}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDbClient(supabase) as any;

    const { error: txError } = await db.from("transactions").insert({
      id: transactionId,
      user_id: user.id,
      amount,
      currency: "BRL",
      type: "deposit",
      status: "pending",
      description: `Depósito - ${categoryLabel}`,
      payment_method: paymentMethod === "card" ? "mercadopago_card" : "mercadopago_pix",
      metadata: {
        category,
        category_label: categoryLabel,
        payment_provider: "mercadopago",
        payment_method: paymentMethod,
      },
    });

    if (txError) {
      console.error("[Payments] Error creating transaction:", txError);
      return NextResponse.json({ error: "Erro ao registrar transação" }, { status: 500 });
    }

    const payer = {
      email: payerEmail || profileData.email,
      firstName: payerFirstName || profileData.first_name,
      lastName: payerLastName || profileData.last_name || undefined,
      identification:
        payerDocType && payerDocNumber
          ? { type: payerDocType, number: payerDocNumber }
          : undefined,
    };

    if (paymentMethod === "card") {
      const payment = await createCardPayment({
        transactionId,
        amount,
        token: token!,
        paymentMethodId: paymentMethodId!,
        installments: installments || 1,
        issuerId,
        payer,
        description,
      });

      const mpStatus = payment.status || "pending";
      const txStatus =
        mpStatus === "approved"
          ? "approved"
          : mpStatus === "rejected"
            ? "rejected"
            : "pending";

      await db
        .from("transactions")
        .update({
          status: txStatus,
          updated_at: new Date().toISOString(),
          ...(txStatus === "approved" ? { processed_at: new Date().toISOString() } : {}),
          metadata: {
            category,
            category_label: categoryLabel,
            payment_provider: "mercadopago",
            payment_method: "card",
            mp_payment_id: String(payment.id),
            mp_status: mpStatus,
            mp_status_detail: payment.status_detail,
            mp_payment_type: payment.payment_type_id,
          },
        })
        .eq("id", transactionId);

      if (txStatus === "approved") {
        await db.from("notifications").insert({
          user_id: user.id,
          type: "system",
          title: "Depósito Confirmado!",
          message: `Seu depósito de R$ ${amount.toFixed(2)} foi confirmado com sucesso.`,
          action_url: "/dashboard",
        });
      }

      return NextResponse.json({
        transactionId,
        paymentId: String(payment.id),
        status: mpStatus,
        statusDetail: payment.status_detail,
      });
    }

    // PIX payment
    const payment = await createPixPayment({
      transactionId,
      amount,
      payer,
      description,
      expirationMinutes: 30,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pointOfInteraction = (payment as any).point_of_interaction;
    const transactionData = pointOfInteraction?.transaction_data;

    await db
      .from("transactions")
      .update({
        metadata: {
          category,
          category_label: categoryLabel,
          payment_provider: "mercadopago",
          payment_method: "pix",
          mp_payment_id: String(payment.id),
          mp_status: payment.status,
          pix_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      })
      .eq("id", transactionId);

    return NextResponse.json({
      transactionId,
      paymentId: String(payment.id),
      status: payment.status,
      pix: {
        qrCode: transactionData?.qr_code || "",
        qrCodeBase64: transactionData?.qr_code_base64 || "",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("[Payments] Error processing payment:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao processar pagamento",
      },
      { status: 500 }
    );
  }
}
