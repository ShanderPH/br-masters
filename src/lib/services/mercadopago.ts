import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.warn("[MercadoPago] MERCADOPAGO_ACCESS_TOKEN not configured");
}

const client = new MercadoPagoConfig({
  accessToken: accessToken || "",
});

export const preferenceClient = new Preference(client);
export const paymentClient = new Payment(client);

export type DepositCategory =
  | "tournament_prize"
  | "round_prize"
  | "match_prize";

interface CreateDepositPreferenceParams {
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  category: DepositCategory;
  categoryLabel: string;
  transactionId: string;
}

export async function createDepositPreference(
  params: CreateDepositPreferenceParams
) {
  const {
    userId,
    userEmail,
    userName,
    amount,
    category,
    categoryLabel,
    transactionId,
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: `deposit_${category}_${transactionId}`,
          title: `BR Masters - ${categoryLabel}`,
          description: `Depósito para ${categoryLabel} no BR Masters`,
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: userEmail,
        name: userName,
      },
      back_urls: {
        success: `${appUrl}/dashboard?payment=success&tx=${transactionId}`,
        failure: `${appUrl}/dashboard?payment=failure&tx=${transactionId}`,
        pending: `${appUrl}/dashboard?payment=pending&tx=${transactionId}`,
      },
      auto_return: "approved",
      external_reference: transactionId,
      notification_url: `${appUrl}/api/payments/webhook`,
      statement_descriptor: "BR MASTERS",
      metadata: {
        user_id: userId,
        transaction_id: transactionId,
        category,
        category_label: categoryLabel,
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(
        Date.now() + 30 * 60 * 1000
      ).toISOString(),
    },
  });

  return preference;
}

export async function getPaymentById(paymentId: string | number) {
  return paymentClient.get({ id: Number(paymentId) });
}

interface PayerInfo {
  email: string;
  firstName: string;
  lastName?: string;
  identification?: {
    type: string;
    number: string;
  };
}

interface CreateCardPaymentParams {
  transactionId: string;
  amount: number;
  token: string;
  paymentMethodId: string;
  installments: number;
  issuerId?: string;
  payer: PayerInfo;
  description: string;
}

export async function createCardPayment(params: CreateCardPaymentParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Only include notification_url for production (HTTPS URLs)
  const isProduction = appUrl.startsWith("https://");
  const notificationUrl = isProduction ? `${appUrl}/api/payments/webhook` : undefined;

  return paymentClient.create({
    body: {
      transaction_amount: params.amount,
      token: params.token,
      description: params.description,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      issuer_id: params.issuerId ? Number(params.issuerId) : undefined,
      payer: {
        email: params.payer.email,
        first_name: params.payer.firstName,
        last_name: params.payer.lastName,
        identification: params.payer.identification,
      },
      external_reference: params.transactionId,
      ...(notificationUrl && { notification_url: notificationUrl }),
      statement_descriptor: "BR MASTERS",
    },
    requestOptions: {
      idempotencyKey: params.transactionId,
    },
  });
}

interface CreatePixPaymentParams {
  transactionId: string;
  amount: number;
  payer: PayerInfo;
  description: string;
  expirationMinutes?: number;
}

export async function createPixPayment(params: CreatePixPaymentParams) {
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado no servidor");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const expMinutes = params.expirationMinutes || 30;
  const expirationDate = new Date(Date.now() + expMinutes * 60 * 1000);
  
  // Only include notification_url for production (HTTPS URLs)
  // MP rejects localhost URLs as invalid
  const isProduction = appUrl.startsWith("https://");
  const notificationUrl = isProduction ? `${appUrl}/api/payments/webhook` : undefined;

  console.log("[MercadoPago] Creating PIX payment:", {
    amount: params.amount,
    email: params.payer.email,
    transactionId: params.transactionId,
    notificationUrl: notificationUrl || "(skipped - localhost)",
  });

  try {
    const result = await paymentClient.create({
    body: {
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: "pix",
      payer: {
        email: params.payer.email,
        first_name: params.payer.firstName,
        last_name: params.payer.lastName,
        identification: params.payer.identification,
      },
      external_reference: params.transactionId,
      ...(notificationUrl && { notification_url: notificationUrl }),
      statement_descriptor: "BR MASTERS",
      date_of_expiration: expirationDate.toISOString(),
    },
    requestOptions: {
      idempotencyKey: `pix_${params.transactionId}`,
    },
  });
    
    console.log("[MercadoPago] PIX payment created:", {
      id: result.id,
      status: result.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hasQrCode: !!(result as any).point_of_interaction,
    });
    
    return result;
  } catch (error) {
    console.error("[MercadoPago] Error creating PIX payment:", error);
    throw error;
  }
}
