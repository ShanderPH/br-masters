"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Target,
  Gamepad2,
  CreditCard,
  QrCode,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { TextField, Label, Input, FieldError } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";

import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import { PaymentTimer } from "@/components/checkout/payment-timer";
import { useMercadoPago } from "@/hooks/use-mercadopago";

const TEST_EMAIL_DOMAINS = ["houseofguess.app", "test.com", "example.com"];

function isTestEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return TEST_EMAIL_DOMAINS.some((d) => domain?.includes(d));
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email) && !isTestEmail(email);
}

type DepositCategory = "tournament_prize" | "round_prize" | "match_prize";
type PaymentMethod = "card" | "pix";
type CheckoutStep = 0 | 1 | 2 | 3 | 4;

interface CheckoutClientProps {
  userId: string;
  userEmail: string;
  userName: string;
  userLastName: string;
}

const CATEGORIES = [
  {
    id: "tournament_prize" as DepositCategory,
    label: "Premiação por Torneio",
    description: "Premiação acumulada do torneio completo",
    icon: <Trophy className="w-6 h-6" />,
    color: "#CCFF00",
  },
  {
    id: "round_prize" as DepositCategory,
    label: "Premiação por Rodada",
    description: "Premiação da rodada atual",
    icon: <Target className="w-6 h-6" />,
    color: "#25B8B8",
  },
  {
    id: "match_prize" as DepositCategory,
    label: "Premiação por Partida",
    description: "Premiação por partida individual",
    icon: <Gamepad2 className="w-6 h-6" />,
    color: "#D63384",
  },
];

const QUICK_AMOUNTS = [10, 25, 50, 100];
const MIN_AMOUNT = 5;
const MAX_AMOUNT = 5000;

const STEPS = [
  { id: "category", label: "Categoria", icon: <Trophy className="w-4 h-4" /> },
  { id: "amount", label: "Valor", icon: <span className="text-sm font-bold">R$</span> },
  { id: "method", label: "Pagamento", icon: <CreditCard className="w-4 h-4" /> },
  { id: "details", label: "Dados", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "status", label: "Status", icon: <Check className="w-4 h-4" /> },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 200 : -200,
    opacity: 0,
  }),
};

export function CheckoutClient({
  userId,
  userEmail,
  userName,
  userLastName,
}: CheckoutClientProps) {
  const router = useRouter();
  const mp = useMercadoPago();
  const supabase = createClient();

  const [step, setStep] = useState<CheckoutStep>(0);
  const [direction, setDirection] = useState(1);
  const [category, setCategory] = useState<DepositCategory | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  // Email state - for users with test emails
  const needsEmailUpdate = isTestEmail(userEmail);
  const [email, setEmail] = useState(needsEmailUpdate ? "" : userEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = emailTouched && email.length > 0 && !isValidEmail(email)
    ? "Digite um e-mail válido (não pode ser e-mail de teste)"
    : null;
  const isEmailValid = !needsEmailUpdate || isValidEmail(email);

  // Card state
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState(userName + (userLastName ? ` ${userLastName}` : ""));
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [docType] = useState("CPF");
  const [docNumber, setDocNumber] = useState("");
  const [installments, setInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<
    Array<{ installments: number; message: string }>
  >([]);
  const [detectedPaymentMethod, setDetectedPaymentMethod] = useState<{
    id: string;
    name: string;
    thumbnail: string;
  } | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PIX state
  const [pixQrCode, setPixQrCode] = useState("");
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState("");
  const [pixExpiresAt, setPixExpiresAt] = useState("");
  const [pixCopied, setPixCopied] = useState(false);

  // Payment result
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [timerStatus, setTimerStatus] = useState<"waiting" | "confirmed" | "expired" | "error">("waiting");

  const numAmount = parseFloat(amount) || 0;

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4) as CheckoutStep);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0) as CheckoutStep);
  };

  // Detect card payment method from BIN
  useEffect(() => {
    if (!mp.isLoaded || cardNumber.replace(/\s/g, "").length < 6) {
      setDetectedPaymentMethod(null);
      setInstallmentOptions([]);
      return;
    }

    const bin = cardNumber.replace(/\s/g, "").substring(0, 6);
    let cancelled = false;

    mp.getPaymentMethods(bin).then((result) => {
      if (cancelled || !result.results?.length) return;
      const pm = result.results[0];
      setDetectedPaymentMethod({ id: pm.id, name: pm.name, thumbnail: pm.secure_thumbnail || pm.thumbnail });
    }).catch(() => {});

    if (numAmount > 0) {
      mp.getInstallments(numAmount, bin).then((result) => {
        if (cancelled || !result?.length) return;
        const options = result[0].payer_costs.map((pc) => ({
          installments: pc.installments,
          message: pc.recommended_message,
        }));
        setInstallmentOptions(options);
      }).catch(() => {});
    }

    return () => { cancelled = true; };
  }, [cardNumber, numAmount, mp.isLoaded, mp]);

  // Poll payment status for PIX
  useEffect(() => {
    if (!transactionId || paymentMethod !== "pix" || timerStatus !== "waiting") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${transactionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "approved") {
          setPaymentStatus("approved");
          setTimerStatus("confirmed");
          clearInterval(interval);
        } else if (data.status === "rejected") {
          setPaymentStatus("rejected");
          setTimerStatus("error");
          clearInterval(interval);
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [transactionId, paymentMethod, timerStatus]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").substring(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").substring(0, 4);
    if (digits.length >= 3) return `${digits.substring(0, 2)}/${digits.substring(2)}`;
    return digits;
  };

  const handleProcessPayment = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      if (paymentMethod === "card") {
        if (!mp.isLoaded) throw new Error("SDK de pagamento não carregado");

        const [expMonth, expYear] = cardExpiry.split("/");
        const token = await mp.createCardToken({
          cardNumber: cardNumber.replace(/\s/g, ""),
          cardholderName: cardHolder,
          cardExpirationMonth: expMonth,
          cardExpirationYear: `20${expYear}`,
          securityCode: cardCvv,
          identificationType: docType,
          identificationNumber: docNumber.replace(/\D/g, ""),
        });

        const res = await fetch("/api/payments/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: numAmount,
            category,
            paymentMethod: "card",
            token: token.id,
            paymentMethodId: detectedPaymentMethod?.id || "visa",
            installments,
            payerEmail: userEmail,
            payerFirstName: userName,
            payerLastName: userLastName || undefined,
            payerDocType: docType,
            payerDocNumber: docNumber.replace(/\D/g, ""),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao processar pagamento");

        setTransactionId(data.transactionId);
        setPaymentStatus(data.status);

        if (data.status === "approved") {
          setTimerStatus("confirmed");
        } else if (data.status === "rejected") {
          setTimerStatus("error");
          setError(`Pagamento recusado: ${data.statusDetail || "tente novamente"}`);
        } else {
          setTimerStatus("waiting");
        }

        goNext();
      } else {
        // PIX
        const effectiveEmail = needsEmailUpdate ? email : userEmail;

        // Update user email in Supabase if it was changed
        if (needsEmailUpdate && isValidEmail(email)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (supabase as any)
            .from("user_profiles")
            .update({ email })
            .eq("id", userId);
          
          if (updateError) {
            console.warn("[Checkout] Failed to update user email:", updateError);
          }
        }

        const res = await fetch("/api/payments/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: numAmount,
            category,
            paymentMethod: "pix",
            payerEmail: effectiveEmail,
            payerFirstName: userName,
            payerLastName: userLastName || undefined,
            payerDocType: docType,
            payerDocNumber: docNumber.replace(/\D/g, "") || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          const errorMsg = data.error || "Erro ao gerar PIX";
          const details = data.details ? ` (${JSON.stringify(data.details)})` : "";
          throw new Error(`${errorMsg}${details}`);
        }

        setTransactionId(data.transactionId);
        setPixQrCode(data.pix.qrCode);
        setPixQrCodeBase64(data.pix.qrCodeBase64);
        setPixExpiresAt(data.pix.expiresAt);
        setPaymentStatus("pending");
        setTimerStatus("waiting");

        goNext();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing, paymentMethod, mp, cardExpiry, cardNumber, cardHolder,
    cardCvv, docType, docNumber, numAmount, category, detectedPaymentMethod,
    installments, userEmail, userName, userLastName, email, needsEmailUpdate,
    supabase, userId,
  ]);

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixQrCode);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    } catch {}
  };

  const canProceedFromAmount = numAmount >= MIN_AMOUNT && numAmount <= MAX_AMOUNT;

  const isCardFormValid =
    cardNumber.replace(/\s/g, "").length >= 15 &&
    cardHolder.length >= 3 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3 &&
    docNumber.replace(/\D/g, "").length >= 11;

  // ────────────── RENDER ──────────────

  return (
    <div className="min-h-screen bg-[#1A1A2E] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#25B8B8]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D63384]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4B3B7F]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => (step === 0 ? router.push("/dashboard") : goBack())}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h1 className="font-display font-black text-lg text-white uppercase tracking-wide">
              Depósito
            </h1>
            <p className="text-xs text-white/40">Checkout seguro</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[#25B8B8]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">Seguro</span>
          </div>
        </div>

        {/* Stepper */}
        <CheckoutStepper steps={STEPS} currentStep={step} />

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#D63384]/10 border border-[#D63384]/30 px-4 py-3 mb-4 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-[#D63384] mt-0.5 shrink-0" />
              <p className="text-sm text-[#D63384]">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps content */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait" custom={direction}>
            {/* STEP 0: Category */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <h2 className="font-display font-black text-white uppercase text-sm tracking-wider mb-4">
                  Selecione a Categoria
                </h2>
                {CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCategory(cat.id);
                      goNext();
                    }}
                    className={`
                      w-full p-4 text-left flex items-center gap-4
                      border transition-all duration-200
                      ${
                        category === cat.id
                          ? "bg-white/10 border-white/20"
                          : "bg-white/3 border-white/6 hover:bg-white/6 hover:border-white/10"
                      }
                    `}
                  >
                    <div
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <span
                        className="font-display font-bold text-sm block"
                        style={{ color: cat.color }}
                      >
                        {cat.label}
                      </span>
                      <span className="text-xs text-white/40">{cat.description}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20" />
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* STEP 1: Amount */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="font-display font-black text-white uppercase text-sm tracking-wider">
                  Valor do Depósito
                </h2>

                <div className="bg-white/3 border border-white/6 p-6">
                  <div className="flex items-baseline gap-2 justify-center mb-6">
                    <span className="text-white/40 text-2xl font-display">R$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      min={MIN_AMOUNT}
                      max={MAX_AMOUNT}
                      step="0.01"
                      className="bg-transparent text-center text-4xl font-display font-black text-white outline-none w-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-center flex-wrap">
                    {QUICK_AMOUNTS.map((qa) => (
                      <button
                        key={qa}
                        onClick={() => setAmount(String(qa))}
                        className={`
                          px-4 py-2 font-display font-bold text-sm transition-all
                          ${
                            numAmount === qa
                              ? "bg-[#25B8B8] text-white"
                              : "bg-white/5 text-white/60 hover:bg-white/10"
                          }
                        `}
                      >
                        R$ {qa}
                      </button>
                    ))}
                  </div>

                  <p className="text-center text-xs text-white/30 mt-4">
                    Mín. R$ {MIN_AMOUNT},00 — Máx. R$ {MAX_AMOUNT.toLocaleString("pt-BR")},00
                  </p>
                </div>

                <button
                  onClick={goNext}
                  disabled={!canProceedFromAmount}
                  className={`
                    w-full py-3.5 font-display font-black uppercase text-sm tracking-wider
                    flex items-center justify-center gap-2 transition-all
                    ${
                      canProceedFromAmount
                        ? "bg-[#25B8B8] text-white hover:brightness-110"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    }
                  `}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: Payment Method */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h2 className="font-display font-black text-white uppercase text-sm tracking-wider">
                  Método de Pagamento
                </h2>

                <div className="bg-white/3 border border-white/6 p-4 flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Valor:</span>
                  <span className="font-display font-black text-[#CCFF00] text-lg">
                    R$ {numAmount.toFixed(2)}
                  </span>
                </div>

                {([
                  {
                    id: "pix" as PaymentMethod,
                    label: "PIX",
                    desc: "Pagamento instantâneo",
                    icon: <QrCode className="w-6 h-6" />,
                    color: "#25B8B8",
                    badge: "Recomendado",
                  },
                  {
                    id: "card" as PaymentMethod,
                    label: "Cartão de Crédito",
                    desc: "Visa, Mastercard, Elo e mais",
                    icon: <CreditCard className="w-6 h-6" />,
                    color: "#CCFF00",
                    badge: null,
                  },
                ]).map((pm) => (
                  <motion.button
                    key={pm.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setPaymentMethod(pm.id);
                      goNext();
                    }}
                    className={`
                      w-full p-4 text-left flex items-center gap-4
                      border transition-all duration-200
                      ${
                        paymentMethod === pm.id
                          ? "bg-white/10 border-white/20"
                          : "bg-white/3 border-white/6 hover:bg-white/6"
                      }
                    `}
                  >
                    <div
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ backgroundColor: `${pm.color}15`, color: pm.color }}
                    >
                      {pm.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-white">
                          {pm.label}
                        </span>
                        {pm.badge && (
                          <span className="text-[9px] font-bold uppercase bg-[#25B8B8]/20 text-[#25B8B8] px-1.5 py-0.5">
                            {pm.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/40">{pm.desc}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20" />
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* STEP 3: Payment Details */}
            {step === 3 && paymentMethod === "card" && (
              <motion.div
                key="step-3-card"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h2 className="font-display font-black text-white uppercase text-sm tracking-wider">
                  Dados do Cartão
                </h2>

                <div className="space-y-3">
                  {/* Card Number */}
                  <div className="bg-white/3 border border-white/6 p-3">
                    <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                      Número do Cartão
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="bg-transparent text-white text-sm font-mono outline-none flex-1 placeholder:text-white/20"
                      />
                      {detectedPaymentMethod?.thumbnail && (
                        <img
                          src={detectedPaymentMethod.thumbnail}
                          alt={detectedPaymentMethod.name}
                          className="h-6"
                        />
                      )}
                    </div>
                  </div>

                  {/* Cardholder */}
                  <div className="bg-white/3 border border-white/6 p-3">
                    <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                      Nome no Cartão
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="NOME IMPRESSO NO CARTÃO"
                      className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/20"
                    />
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/3 border border-white/6 p-3">
                      <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                        Validade
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/AA"
                        maxLength={5}
                        className="bg-transparent text-white text-sm font-mono outline-none w-full placeholder:text-white/20"
                      />
                    </div>
                    <div className="bg-white/3 border border-white/6 p-3">
                      <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="bg-transparent text-white text-sm font-mono outline-none w-full placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* CPF */}
                  <div className="bg-white/3 border border-white/6 p-3">
                    <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                      CPF do Titular
                    </label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").substring(0, 11);
                        const formatted = digits
                          .replace(/(\d{3})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                        setDocNumber(formatted);
                      }}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="bg-transparent text-white text-sm font-mono outline-none w-full placeholder:text-white/20"
                    />
                  </div>

                  {/* Installments */}
                  {installmentOptions.length > 0 && (
                    <div className="bg-white/3 border border-white/6 p-3">
                      <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                        Parcelas
                      </label>
                      <div className="relative">
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          className="bg-transparent text-white text-sm outline-none w-full appearance-none pr-8 cursor-pointer"
                        >
                          {installmentOptions.map((opt) => (
                            <option key={opt.installments} value={opt.installments} className="bg-[#1A1A2E]">
                              {opt.message}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleProcessPayment}
                  disabled={!isCardFormValid || isProcessing}
                  className={`
                    w-full py-3.5 font-display font-black uppercase text-sm tracking-wider
                    flex items-center justify-center gap-2 transition-all mt-4
                    ${
                      isCardFormValid && !isProcessing
                        ? "bg-[#CCFF00] text-[#1A1A2E] hover:brightness-110"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    }
                  `}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Pagar R$ {numAmount.toFixed(2)}
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {step === 3 && paymentMethod === "pix" && (
              <motion.div
                key="step-3-pix"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h2 className="font-display font-black text-white uppercase text-sm tracking-wider">
                  Pagamento via PIX
                </h2>

                {/* Email field - only shown when user has test email */}
                {needsEmailUpdate && (
                  <TextField
                    isRequired
                    isInvalid={!!emailError}
                    name="email"
                    type="email"
                    className="w-full"
                    onChange={(value) => {
                      setEmail(value);
                      setEmailTouched(true);
                    }}
                  >
                    <Label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                      E-mail para pagamento
                    </Label>
                    <Input
                      value={email}
                      placeholder="seu@email.com"
                      className="bg-white/3 border border-white/6 p-3 text-white text-sm outline-none w-full placeholder:text-white/20"
                    />
                    {emailError ? (
                      <FieldError className="text-[10px] text-[#D63384] mt-1">
                        {emailError}
                      </FieldError>
                    ) : (
                      <p className="text-[10px] text-white/30 mt-1">
                        Informe um e-mail válido para receber o comprovante
                      </p>
                    )}
                  </TextField>
                )}

                {/* CPF for PIX */}
                <div className="bg-white/3 border border-white/6 p-3">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                    CPF (opcional)
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").substring(0, 11);
                      const formatted = digits
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                      setDocNumber(formatted);
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="bg-transparent text-white text-sm font-mono outline-none w-full placeholder:text-white/20"
                  />
                </div>

                <div className="bg-white/3 border border-white/6 p-4 flex items-center justify-between">
                  <span className="text-xs text-white/40">Valor:</span>
                  <span className="font-display font-black text-[#CCFF00] text-lg">
                    R$ {numAmount.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleProcessPayment}
                  disabled={isProcessing || !isEmailValid}
                  className={`
                    w-full py-3.5 font-display font-black uppercase text-sm tracking-wider
                    flex items-center justify-center gap-2 transition-all
                    ${
                      !isProcessing && isEmailValid
                        ? "bg-[#25B8B8] text-white hover:brightness-110"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    }
                  `}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      Gerar QR Code PIX
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* STEP 4: Payment Status */}
            {step === 4 && (
              <motion.div
                key="step-4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Card payment result */}
                {paymentMethod === "card" && (
                  <div className="flex flex-col items-center gap-6 py-6">
                    {paymentStatus === "approved" && (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          className="w-20 h-20 bg-[#CCFF00]/10 flex items-center justify-center"
                        >
                          <Sparkles className="w-10 h-10 text-[#CCFF00]" />
                        </motion.div>
                        <div className="text-center">
                          <h3 className="font-display font-black text-xl text-[#CCFF00] uppercase">
                            Pagamento Aprovado!
                          </h3>
                          <p className="text-sm text-white/50 mt-1">
                            R$ {numAmount.toFixed(2)} depositado com sucesso
                          </p>
                        </div>
                      </>
                    )}
                    {paymentStatus === "rejected" && (
                      <>
                        <div className="w-20 h-20 bg-[#D63384]/10 flex items-center justify-center">
                          <AlertCircle className="w-10 h-10 text-[#D63384]" />
                        </div>
                        <div className="text-center">
                          <h3 className="font-display font-black text-xl text-[#D63384] uppercase">
                            Pagamento Recusado
                          </h3>
                          <p className="text-sm text-white/50 mt-1">
                            {error || "Tente novamente com outro cartão"}
                          </p>
                        </div>
                      </>
                    )}
                    {paymentStatus === "pending" && (
                      <>
                        <Loader2 className="w-12 h-12 text-[#25B8B8] animate-spin" />
                        <div className="text-center">
                          <h3 className="font-display font-black text-lg text-white uppercase">
                            Processando...
                          </h3>
                          <p className="text-sm text-white/50 mt-1">
                            Aguarde a confirmação
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* PIX payment status */}
                {paymentMethod === "pix" && (
                  <div className="flex flex-col items-center gap-4">
                    <PaymentTimer
                      expiresAt={pixExpiresAt}
                      status={timerStatus}
                      onExpire={() => setTimerStatus("expired")}
                    />

                    {timerStatus === "waiting" && (
                      <>
                        {pixQrCodeBase64 && (
                          <div className="bg-white p-3 inline-block">
                            <img
                              src={`data:image/png;base64,${pixQrCodeBase64}`}
                              alt="PIX QR Code"
                              className="w-48 h-48"
                            />
                          </div>
                        )}

                        {pixQrCode && (
                          <div className="w-full">
                            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1 text-center">
                              Código PIX Copia e Cola
                            </p>
                            <div className="bg-white/3 border border-white/6 p-3 flex items-center gap-2">
                              <code className="text-xs text-white/60 flex-1 truncate font-mono">
                                {pixQrCode}
                              </code>
                              <button
                                onClick={copyPixCode}
                                className="shrink-0 p-2 bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                {pixCopied ? (
                                  <Check className="w-4 h-4 text-[#CCFF00]" />
                                ) : (
                                  <Copy className="w-4 h-4 text-white/60" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-white/40 text-center">
                          Abra o app do seu banco e escaneie o QR Code ou cole o código PIX
                        </p>
                      </>
                    )}

                    {timerStatus === "confirmed" && (
                      <div className="text-center">
                        <h3 className="font-display font-black text-xl text-[#CCFF00] uppercase">
                          Pagamento Confirmado!
                        </h3>
                        <p className="text-sm text-white/50 mt-1">
                          R$ {numAmount.toFixed(2)} depositado com sucesso
                        </p>
                      </div>
                    )}

                    {timerStatus === "expired" && (
                      <div className="text-center">
                        <h3 className="font-display font-black text-lg text-[#D63384] uppercase">
                          PIX Expirado
                        </h3>
                        <p className="text-sm text-white/50 mt-1">
                          O tempo para pagamento acabou. Tente novamente.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3 pt-4">
                  {(timerStatus === "confirmed" || paymentStatus === "approved") && (
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="w-full py-3.5 bg-[#CCFF00] text-[#1A1A2E] font-display font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      Voltar ao Dashboard
                    </button>
                  )}

                  {(timerStatus === "expired" || timerStatus === "error" || paymentStatus === "rejected") && (
                    <button
                      onClick={() => {
                        setStep(2);
                        setDirection(-1);
                        setError(null);
                        setTransactionId(null);
                        setPaymentStatus("pending");
                        setTimerStatus("waiting");
                      }}
                      className="w-full py-3.5 bg-white/5 text-white font-display font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Tentar Novamente
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-white/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[10px] font-display uppercase tracking-wider">
            Pagamento processado por Mercado Pago
          </span>
        </div>
      </div>
    </div>
  );
}
