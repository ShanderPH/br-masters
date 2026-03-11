import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPaymentById } from "@/lib/services/mercadopago";

function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): { valid: boolean; reason?: string } {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // If no secret configured, skip verification (for testing)
  if (!secret || secret === "your_webhook_secret_signature") {
    console.warn("[Webhook] No webhook secret configured, skipping signature verification");
    return { valid: true, reason: "no_secret_configured" };
  }

  if (!xSignature || !xRequestId) {
    return { valid: false, reason: "missing_headers" };
  }

  const parts = xSignature.split(",");
  let ts = "";
  let hash = "";

  for (const part of parts) {
    const [key, value] = part.trim().split("=");
    if (key === "ts") ts = value;
    if (key === "v1") hash = value;
  }

  if (!ts || !hash) {
    return { valid: false, reason: "invalid_signature_format" };
  }

  // MP docs say data.id should be lowercase in the manifest
  const dataIdLower = dataId.toLowerCase();
  const manifest = `id:${dataIdLower};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  if (hmac === hash) {
    return { valid: true };
  }

  // Try with original case as fallback
  const manifestOriginal = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmacOriginal = crypto
    .createHmac("sha256", secret)
    .update(manifestOriginal)
    .digest("hex");

  if (hmacOriginal === hash) {
    return { valid: true };
  }

  return { valid: false, reason: "signature_mismatch" };
}

export async function POST(request: NextRequest) {
  console.log("[Webhook] Received POST request");
  
  try {
    const body = await request.json();
    console.log("[Webhook] Body:", JSON.stringify(body));

    const { type, data, action } = body as {
      type?: string;
      data?: { id?: string };
      action?: string;
    };

    // Accept both 'payment' type and merchant_order (which also contains payment info)
    if (!data?.id) {
      console.log("[Webhook] No data.id, returning 200");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Skip non-payment types but return 200 to acknowledge receipt
    if (type !== "payment") {
      console.log(`[Webhook] Received type '${type}', acknowledging but not processing`);
      return NextResponse.json({ received: true, type }, { status: 200 });
    }

    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    console.log("[Webhook] Headers - x-signature:", xSignature?.substring(0, 50) + "...");
    console.log("[Webhook] Headers - x-request-id:", xRequestId);

    const signatureResult = verifyWebhookSignature(
      xSignature,
      xRequestId,
      data.id
    );

    if (!signatureResult.valid) {
      console.warn("[Webhook] Invalid signature for payment:", data.id, "Reason:", signatureResult.reason);
      return NextResponse.json(
        { error: "Invalid signature", reason: signatureResult.reason },
        { status: 401 }
      );
    }

    console.log("[Webhook] Signature valid, reason:", signatureResult.reason || "verified");

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

    // Use service client if available (bypasses RLS), otherwise fall back to regular client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let db: any;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      db = createServiceClient();
    } else {
      console.warn("[Webhook] SUPABASE_SERVICE_ROLE_KEY not set, using regular client");
      db = await createClient();
    }

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
