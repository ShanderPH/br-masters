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
