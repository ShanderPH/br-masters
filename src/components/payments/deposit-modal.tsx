"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Modal } from "@heroui/react";
import {
  Wallet,
  Trophy,
  Target,
  Swords,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Minus,
  Plus,
  Zap,
  Shield,
} from "lucide-react";

type DepositCategory = "tournament_prize" | "round_prize" | "match_prize";

interface DepositModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES: {
  id: DepositCategory;
  label: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  gradient: string;
  borderColor: string;
}[] = [
  {
    id: "tournament_prize",
    label: "Torneio",
    description: "Premiação geral do campeonato",
    icon: Trophy,
    color: "text-[#CCFF00]",
    gradient: "from-[#CCFF00]/20 to-[#CCFF00]/5",
    borderColor: "border-[#CCFF00]/30",
  },
  {
    id: "round_prize",
    label: "Rodada",
    description: "Premiação por rodada",
    icon: Target,
    color: "text-[#25B8B8]",
    gradient: "from-[#25B8B8]/20 to-[#25B8B8]/5",
    borderColor: "border-[#25B8B8]/30",
  },
  {
    id: "match_prize",
    label: "Partida",
    description: "Premiação por partida",
    icon: Swords,
    color: "text-[#D63384]",
    gradient: "from-[#D63384]/20 to-[#D63384]/5",
    borderColor: "border-[#D63384]/30",
  },
];

const PRESET_AMOUNTS = [5, 10, 20, 50, 100];

type ModalStep = "select" | "amount" | "processing" | "success" | "error";

export function DepositModal({ isOpen, onOpenChange }: DepositModalProps) {
  const [step, setStep] = useState<ModalStep>("select");
  const [selectedCategory, setSelectedCategory] =
    useState<DepositCategory | null>(null);
  const [amount, setAmount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetState = useCallback(() => {
    setStep("select");
    setSelectedCategory(null);
    setAmount(10);
    setIsSubmitting(false);
    setErrorMessage("");
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetState();
      }
      onOpenChange(open);
    },
    [onOpenChange, resetState]
  );

  const handleCategorySelect = (category: DepositCategory) => {
    setSelectedCategory(category);
    setStep("amount");
  };

  const handleAmountChange = (newAmount: number) => {
    const clamped = Math.max(5, Math.min(5000, newAmount));
    setAmount(clamped);
  };

  const handleSubmit = async () => {
    if (!selectedCategory || amount < 5) return;

    setIsSubmitting(true);
    setStep("processing");

    try {
      const res = await fetch("/api/payments/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, category: selectedCategory }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar pagamento");
      }

      const redirectUrl = data.initPoint || data.sandboxInitPoint;

      if (redirectUrl) {
        setStep("success");
        setTimeout(() => {
          window.open(redirectUrl, "_blank");
        }, 1500);
      } else {
        throw new Error("URL de pagamento não disponível");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro inesperado"
      );
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryData = CATEGORIES.find(
    (c) => c.id === selectedCategory
  );

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        variant="blur"
        className="bg-linear-to-t from-black/80 via-black/50 to-transparent"
      >
        <Modal.Container placement="center" size="md">
          <Modal.Dialog className="bg-[#1A1A2E] border border-white/10 overflow-hidden sm:max-w-[440px] relative">
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#25B8B8]/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#D63384]/10 rounded-full blur-3xl" />
              <div className="absolute inset-0 diagonal-stripes opacity-30" />
            </div>

            <Modal.CloseTrigger className="z-50 top-3! right-3! w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors" />

            <Modal.Header className="relative z-10 pb-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    className="w-10 h-10 flex items-center justify-center bg-linear-to-br from-[#25B8B8] to-[#4B3B7F] skew-card"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Wallet className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
                <div>
                  <Modal.Heading className="font-display font-black text-lg uppercase tracking-tight text-white">
                    Depositar
                  </Modal.Heading>
                  <p className="text-[10px] font-semibold text-brm-text-muted uppercase tracking-wider">
                    Escolha sua modalidade
                  </p>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body className="relative z-10 px-4 pb-4 pt-0">
              <AnimatePresence mode="wait">
                {step === "select" && (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2"
                  >
                    {CATEGORIES.map((cat, i) => {
                      const Icon = cat.icon;
                      return (
                        <motion.button
                          key={cat.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`
                            w-full p-3 flex items-center gap-3 
                            bg-linear-to-r ${cat.gradient}
                            border ${cat.borderColor}
                            hover:border-white/20 active:scale-[0.98]
                            transition-all duration-200 group cursor-pointer
                            skew-card
                          `}
                        >
                          <div
                            className={`w-9 h-9 flex items-center justify-center bg-white/5 ${cat.color}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-display font-bold text-sm text-white uppercase tracking-tight">
                              {cat.label}
                            </p>
                            <p className="text-[10px] text-brm-text-muted">
                              {cat.description}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-brm-text-muted group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </motion.button>
                      );
                    })}

                    <div className="flex items-center gap-2 pt-2 px-1">
                      <Shield className="w-3.5 h-3.5 text-[#25B8B8]" />
                      <p className="text-[9px] text-brm-text-muted">
                        Pagamento seguro via Mercado Pago
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === "amount" && selectedCategoryData && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div
                      className={`flex items-center gap-2 p-2 bg-linear-to-r ${selectedCategoryData.gradient} border ${selectedCategoryData.borderColor} skew-card`}
                    >
                      <selectedCategoryData.icon
                        className={`w-4 h-4 ${selectedCategoryData.color}`}
                      />
                      <span className="font-display font-bold text-xs uppercase text-white">
                        {selectedCategoryData.label}
                      </span>
                      <button
                        onClick={() => setStep("select")}
                        className="ml-auto text-[10px] text-brm-text-muted hover:text-white transition-colors cursor-pointer"
                      >
                        Alterar
                      </button>
                    </div>

                    <div className="flex flex-col items-center py-2">
                      <p className="text-[10px] font-semibold text-brm-text-muted uppercase tracking-wider mb-2">
                        Valor do depósito
                      </p>
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAmountChange(amount - 5)}
                          disabled={amount <= 5}
                          className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>

                        <div className="relative">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-brm-text-muted font-display font-bold text-xl">
                            R$
                          </span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) =>
                              handleAmountChange(Number(e.target.value))
                            }
                            min={5}
                            max={5000}
                            className="w-32 text-center font-display font-black text-4xl text-white bg-transparent outline-none pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAmountChange(amount + 5)}
                          disabled={amount >= 5000}
                          className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                      <p className="text-[9px] text-brm-text-muted mt-1">
                        Mín. R$ 5,00 • Máx. R$ 5.000,00
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {PRESET_AMOUNTS.map((preset) => (
                        <motion.button
                          key={preset}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setAmount(preset)}
                          className={`
                            px-3 py-1.5 font-display font-bold text-xs
                            border transition-all cursor-pointer skew-card
                            ${
                              amount === preset
                                ? "bg-[#25B8B8]/20 border-[#25B8B8]/50 text-[#25B8B8]"
                                : "bg-white/5 border-white/10 text-brm-text-secondary hover:border-white/20"
                            }
                          `}
                        >
                          R$ {preset}
                        </motion.button>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        onPress={handleSubmit}
                        isDisabled={amount < 5 || isSubmitting}
                        className="w-full h-12 font-display font-black text-sm uppercase tracking-wider bg-linear-to-r from-[#25B8B8] to-[#4B3B7F] text-white border-0 skew-card gap-2 hover:brightness-110 transition-all"
                      >
                        <Zap className="w-4 h-4" />
                        Depositar R${" "}
                        {amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </motion.div>

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <Shield className="w-3 h-3 text-[#25B8B8]" />
                      <p className="text-[9px] text-brm-text-muted">
                        Pagamento processado com segurança pelo Mercado Pago
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center py-8 gap-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-14 h-14 flex items-center justify-center bg-linear-to-br from-[#25B8B8]/20 to-[#4B3B7F]/20 border border-[#25B8B8]/30"
                    >
                      <Loader2 className="w-7 h-7 text-[#25B8B8]" />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-display font-bold text-sm text-white uppercase">
                        Processando...
                      </p>
                      <p className="text-[10px] text-brm-text-muted mt-1">
                        Preparando seu pagamento
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-8 gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                      className="w-14 h-14 flex items-center justify-center bg-green-500/20 border border-green-500/30"
                    >
                      <CheckCircle className="w-7 h-7 text-green-400" />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-display font-bold text-sm text-white uppercase">
                        Redirecionando...
                      </p>
                      <p className="text-[10px] text-brm-text-muted mt-1">
                        Você será redirecionado ao Mercado Pago
                      </p>
                    </div>

                    <motion.div
                      className="w-full h-1 bg-white/5 overflow-hidden mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="h-full bg-linear-to-r from-[#25B8B8] to-[#CCFF00]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </motion.div>
                  </motion.div>
                )}

                {step === "error" && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-8 gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                      className="w-14 h-14 flex items-center justify-center bg-red-500/20 border border-red-500/30"
                    >
                      <AlertCircle className="w-7 h-7 text-red-400" />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-display font-bold text-sm text-white uppercase">
                        Erro no Pagamento
                      </p>
                      <p className="text-[10px] text-brm-text-muted mt-1 max-w-[280px]">
                        {errorMessage || "Tente novamente mais tarde"}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => handleOpenChange(false)}
                        className="font-display font-semibold text-xs text-brm-text-secondary"
                      >
                        Fechar
                      </Button>
                      <Button
                        size="sm"
                        onPress={() => {
                          setStep("amount");
                          setErrorMessage("");
                        }}
                        className="font-display font-semibold text-xs bg-[#25B8B8]/20 text-[#25B8B8] border border-[#25B8B8]/30"
                      >
                        Tentar Novamente
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
