import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getDb() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for webhook");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServiceClient() as any;
}

function verifySignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || secret === "your_webhook_secret_signature") return true;
  if (!xSignature || !xRequestId) return false;

  const parts = xSignature.split(",");
  let ts = "";
  let hash = "";
  for (const part of parts) {
    const [key, value] = part.trim().split("=");
    if (key === "ts") ts = value;
    if (key === "v1") hash = value;
  }
  if (!ts || !hash) return false;

  for (const id of [dataId.toLowerCase(), dataId]) {
    const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    if (hmac === hash) return true;
  }
  return false;
}

function mapStatus(mpStatus: string): string {
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

async function processPaymentNotification(paymentId: string, action?: string) {
  const { Payment, MercadoPagoConfig } = await import("mercadopago");
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

  const mpClient = new MercadoPagoConfig({ accessToken });
  const paymentApi = new Payment(mpClient);
  const payment = await paymentApi.get({ id: Number(paymentId) });

  if (!payment) {
    console.warn("[Webhook] Payment not found in MP:", paymentId);
    return;
  }

  const externalReference = payment.external_reference;
  if (!externalReference) {
    console.warn("[Webhook] No external_reference:", paymentId);
    return;
  }

  const db = getDb();
  const transactionStatus = mapStatus(payment.status || "pending");

  const { data: existingTx, error: fetchError } = await db
    .from("transactions")
    .select("id, status, user_id, amount, metadata")
    .eq("id", externalReference)
    .single();

  if (fetchError || !existingTx) {
    console.warn("[Webhook] Transaction not found:", externalReference);
    return;
  }

  if (existingTx.status === "approved" || existingTx.status === "completed") {
    console.log("[Webhook] Already processed:", externalReference);
    return;
  }

  const existingMeta = typeof existingTx.metadata === "object" && existingTx.metadata ? existingTx.metadata : {};

  const updatePayload: Record<string, unknown> = {
    status: transactionStatus,
    updated_at: new Date().toISOString(),
    metadata: {
      ...existingMeta,
      mp_payment_id: String(payment.id),
      mp_status: payment.status,
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

  await db.from("transactions").update(updatePayload).eq("id", externalReference);

  if (transactionStatus === "approved" && existingTx.amount > 0) {
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

  console.log(`[Webhook] ${paymentId} -> ${externalReference} = ${transactionStatus}`);
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      console.warn("[Webhook] Failed to parse body, checking query params");
    }

    const url = new URL(request.url);
    const queryDataId = url.searchParams.get("data.id") || url.searchParams.get("id");
    const queryType = url.searchParams.get("type") || url.searchParams.get("topic");

    const type = (body.type as string) || queryType || "";
    const dataId = (body.data as { id?: string })?.id || queryDataId || "";
    const action = (body.action as string) || "";

    console.log(`[Webhook] type=${type} dataId=${dataId} action=${action}`);

    if (!dataId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (type !== "payment") {
      console.log(`[Webhook] Non-payment type: ${type}, ack 200`);
      return NextResponse.json({ received: true, type }, { status: 200 });
    }

    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    if (!verifySignature(xSignature, xRequestId, dataId)) {
      console.warn("[Webhook] Signature mismatch, but returning 200 to stop retries");
    }

    try {
      await processPaymentNotification(dataId, action);
    } catch (processError) {
      console.error("[Webhook] Error processing payment:", processError);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Top-level error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "br-masters-webhook" });
}
