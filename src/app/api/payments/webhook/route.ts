import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { createServiceClient } from "@/lib/supabase/server";
import { getPaymentById } from "@/lib/services/mercadopago";

function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret || !xSignature || !xRequestId) {
    return false;
  }

  const parts = xSignature.split(",");
  let ts = "";
  let hash = "";

  for (const part of parts) {
    const [key, value] = part.trim().split("=");
    if (key === "ts") ts = value;
    if (key === "v1") hash = value;
  }

  if (!ts || !hash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return hmac === hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type, data, action } = body as {
      type?: string;
      data?: { id?: string };
      action?: string;
    };

    if (type !== "payment" || !data?.id) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    const isValid = verifyWebhookSignature(
      xSignature,
      xRequestId,
      data.id
    );

    if (!isValid) {
      console.warn("[Webhook] Invalid signature for payment:", data.id);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payment = await getPaymentById(data.id);

    if (!payment) {
      console.error("[Webhook] Payment not found:", data.id);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const externalReference = payment.external_reference;

    if (!externalReference) {
      console.warn("[Webhook] No external_reference on payment:", data.id);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceClient() as any;

    const mpStatus = payment.status;
    let transactionStatus: string;

    switch (mpStatus) {
      case "approved":
        transactionStatus = "approved";
        break;
      case "pending":
      case "in_process":
      case "authorized":
        transactionStatus = "pending";
        break;
      case "rejected":
      case "cancelled":
        transactionStatus = "rejected";
        break;
      case "refunded":
      case "charged_back":
        transactionStatus = "cancelled";
        break;
      default:
        transactionStatus = "pending";
    }

    const { data: existingTx, error: fetchError } = await db
      .from("transactions")
      .select("id, status, user_id, amount")
      .eq("id", externalReference)
      .single();

    if (fetchError || !existingTx) {
      console.error(
        "[Webhook] Transaction not found:",
        externalReference,
        fetchError
      );
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (
      existingTx.status === "approved" ||
      existingTx.status === "completed"
    ) {
      return NextResponse.json({ received: true, already_processed: true });
    }

    const updatePayload: Record<string, unknown> = {
      status: transactionStatus,
      updated_at: new Date().toISOString(),
      metadata: {
        ...(typeof existingTx.metadata === "object" && existingTx.metadata
          ? existingTx.metadata
          : {}),
        mp_payment_id: String(payment.id),
        mp_status: mpStatus,
        mp_status_detail: payment.status_detail,
        mp_payment_type: payment.payment_type_id,
        mp_date_approved: payment.date_approved,
        webhook_action: action,
        webhook_received_at: new Date().toISOString(),
      },
    };

    if (transactionStatus === "approved") {
      updatePayload.processed_at = new Date().toISOString();
    }

    const { error: updateError } = await db
      .from("transactions")
      .update(updatePayload)
      .eq("id", externalReference);

    if (updateError) {
      console.error(
        "[Webhook] Error updating transaction:",
        externalReference,
        updateError
      );
      return NextResponse.json(
        { error: "Error updating transaction" },
        { status: 500 }
      );
    }

    if (transactionStatus === "approved" && existingTx.amount > 0) {
      const { data: currentProfile } = await db
        .from("user_profiles")
        .select("total_points")
        .eq("id", existingTx.user_id)
        .single();

      if (currentProfile) {
        await db
          .from("points_history")
          .insert({
            user_id: existingTx.user_id,
            points_change: 0,
            reason: "deposit",
            description: `Depósito de R$ ${Number(existingTx.amount).toFixed(2)} confirmado via Mercado Pago`,
          });
      }

      await db.from("notifications").insert({
        user_id: existingTx.user_id,
        type: "system",
        title: "Depósito Confirmado!",
        message: `Seu depósito de R$ ${Number(existingTx.amount).toFixed(2)} foi confirmado com sucesso.`,
        action_url: "/dashboard",
      });
    }

    if (transactionStatus === "rejected") {
      await db.from("notifications").insert({
        user_id: existingTx.user_id,
        type: "system",
        title: "Depósito Não Aprovado",
        message: `Seu depósito de R$ ${Number(existingTx.amount).toFixed(2)} não foi aprovado. Tente novamente.`,
        action_url: "/dashboard",
      });
    }

    console.log(
      `[Webhook] Payment ${data.id} -> Transaction ${externalReference} updated to ${transactionStatus}`
    );

    return NextResponse.json({ received: true, status: transactionStatus });
  } catch (error) {
    console.error("[Webhook] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "br-masters-webhook" });
}
