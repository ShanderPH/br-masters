import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function mapMpStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved": return "approved";
    case "pending":
    case "in_process":
    case "authorized": return "pending";
    case "rejected":
    case "cancelled": return "rejected";
    case "refunded":
    case "charged_back": return "cancelled";
    default: return "pending";
  }
}

async function checkMpPaymentStatus(mpPaymentId: string) {
  const { Payment, MercadoPagoConfig } = await import("mercadopago");
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return null;

  try {
    const mpClient = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(mpClient);
    const payment = await paymentApi.get({ id: Number(mpPaymentId) });
    return payment;
  } catch (error) {
    console.error("[PaymentStatus] MP API error:", error);
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createServiceClient()
      : supabase;

    const { data: transaction, error } = await db
      .from("transactions")
      .select("id, status, amount, type, metadata, created_at, processed_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    // Fallback: if DB still shows pending, check directly with Mercado Pago
    const meta = (transaction.metadata || {}) as Record<string, unknown>;
    const mpPaymentId = meta.mp_payment_id as string | undefined;

    if (transaction.status === "pending" && mpPaymentId) {
      const mpPayment = await checkMpPaymentStatus(mpPaymentId);

      if (mpPayment && mpPayment.status) {
        const resolvedStatus = mapMpStatus(mpPayment.status);

        if (resolvedStatus !== "pending") {
          const updatedMeta = {
            ...meta,
            mp_status: mpPayment.status,
            mp_status_detail: mpPayment.status_detail,
            mp_date_approved: mpPayment.date_approved,
            mp_payment_type: mpPayment.payment_type_id,
            status_checked_via: "polling_fallback",
            status_checked_at: new Date().toISOString(),
          };

          const updatePayload: Record<string, unknown> = {
            status: resolvedStatus,
            updated_at: new Date().toISOString(),
            metadata: updatedMeta,
          };

          if (resolvedStatus === "approved") {
            updatePayload.processed_at = new Date().toISOString();
          }

          await db.from("transactions").update(updatePayload).eq("id", id);

          if (resolvedStatus === "approved" && transaction.amount > 0) {
            await db.from("notifications").insert({
              user_id: user.id,
              type: "system",
              title: "Depósito Confirmado!",
              message: `Seu depósito de R$ ${Number(transaction.amount).toFixed(2)} foi confirmado com sucesso.`,
              action_url: "/dashboard",
            });
          }

          console.log(`[PaymentStatus] Fallback resolved: ${id} -> ${resolvedStatus} (MP: ${mpPayment.status})`);

          return NextResponse.json({
            id: transaction.id,
            status: resolvedStatus,
            amount: transaction.amount,
            type: transaction.type,
            metadata: updatedMeta,
            createdAt: transaction.created_at,
            processedAt: resolvedStatus === "approved" ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      type: transaction.type,
      metadata: transaction.metadata,
      createdAt: transaction.created_at,
      processedAt: transaction.processed_at,
      updatedAt: transaction.updated_at,
    });
  } catch (error) {
    console.error("[PaymentStatus] Error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status" },
      { status: 500 }
    );
  }
}
