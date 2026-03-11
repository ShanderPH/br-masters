"use client";

import { useState, useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale: string }) => MercadoPagoInstance;
  }
}

interface MercadoPagoInstance {
  createCardToken(data: CardTokenData): Promise<CardTokenResult>;
  getInstallments(data: { amount: string; bin: string }): Promise<InstallmentResult[]>;
  getPaymentMethods(data: { bin: string }): Promise<PaymentMethodResult>;
}

interface CardTokenData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType?: string;
  identificationNumber?: string;
}

interface CardTokenResult {
  id: string;
  first_six_digits: string;
  last_four_digits: string;
  expiration_month: number;
  expiration_year: number;
  cardholder: { name: string };
}

interface InstallmentResult {
  payment_method_id: string;
  payment_type_id: string;
  issuer: { id: string; name: string };
  payer_costs: Array<{
    installments: number;
    installment_rate: number;
    recommended_message: string;
    total_amount: number;
    installment_amount: number;
  }>;
}

interface PaymentMethodResult {
  results: Array<{
    id: string;
    name: string;
    payment_type_id: string;
    secure_thumbnail: string;
    thumbnail: string;
  }>;
}

export function useMercadoPago() {
  const [sdkState, setSdkState] = useState({
    isLoaded: false,
    isLoading: true,
    error: null as string | null,
  });
  const mpRef = useRef<MercadoPagoInstance | null>(null);

  useEffect(() => {
    let cancelled = false;
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

    const finish = (loaded: boolean, err: string | null) => {
      if (cancelled) return;
      setSdkState({ isLoaded: loaded, isLoading: false, error: err });
    };

    if (window.MercadoPago && publicKey) {
      mpRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      finish(true, null);
      return;
    }

    if (!publicKey) {
      finish(false, "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY not set");
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://sdk.mercadopago.com/js/v2"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.MercadoPago) {
          mpRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
          finish(true, null);
        }
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.addEventListener("load", () => {
      if (window.MercadoPago) {
        mpRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      }
      finish(!!mpRef.current, mpRef.current ? null : "SDK failed to initialize");
    });
    script.addEventListener("error", () => finish(false, "Failed to load MercadoPago SDK"));
    document.head.appendChild(script);

    return () => { cancelled = true; };
  }, []);

  const createCardToken = useCallback(
    async (data: CardTokenData): Promise<CardTokenResult> => {
      if (!mpRef.current) throw new Error("MercadoPago SDK not loaded");
      return mpRef.current.createCardToken(data);
    },
    []
  );

  const getInstallments = useCallback(
    async (amount: number, bin: string): Promise<InstallmentResult[]> => {
      if (!mpRef.current) throw new Error("MercadoPago SDK not loaded");
      return mpRef.current.getInstallments({ amount: String(amount), bin });
    },
    []
  );

  const getPaymentMethods = useCallback(
    async (bin: string): Promise<PaymentMethodResult> => {
      if (!mpRef.current) throw new Error("MercadoPago SDK not loaded");
      return mpRef.current.getPaymentMethods({ bin });
    },
    []
  );

  return {
    ...sdkState,
    createCardToken,
    getInstallments,
    getPaymentMethods,
  };
}
