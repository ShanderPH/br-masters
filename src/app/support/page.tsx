"use client";

import { useState } from "react";
import NextLink from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import {
  AlertCircle,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ArrowLeft,
  Mail,
  Send,
  Check,
} from "lucide-react";

import { BRMLogo } from "@/components/ui/brm-logo";
import { ROUTES } from "@/lib/routes";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "Como faço para participar?",
    answer:
      "Crie sua conta gratuitamente, acesse o dashboard e comece a fazer seus palpites para as partidas do Brasileirão. Você pode palpitar antes de cada rodada.",
  },
  {
    question: "Como funciona o sistema de pontuação?",
    answer:
      "Você ganha 10 pontos por acertar o placar exato, 5 pontos por acertar o resultado (vitória, empate ou derrota) e 0 pontos por palpite incorreto. Os pontos acumulam ao longo do torneio.",
  },
  {
    question: "Como funcionam os depósitos e prêmios?",
    answer:
      "Você pode depositar via PIX ou cartão de crédito para participar dos prêmios por torneio, rodada ou partida. Os melhores colocados de cada categoria recebem os prêmios proporcionalmente.",
  },
  {
    question: "Até quando posso fazer meu palpite?",
    answer:
      "Os palpites devem ser registrados antes do início de cada partida. Após o apito inicial, o palpite daquela partida é bloqueado.",
  },
  {
    question: "Posso alterar meu palpite?",
    answer:
      "Sim, você pode alterar seu palpite quantas vezes quiser antes do início da partida.",
  },
  {
    question: "Como recupero minha senha?",
    answer:
      "Na tela de login, clique em 'Esqueci senha'. Enviaremos um link de recuperação para o e-mail cadastrado em sua conta.",
  },
  {
    question: "Meu depósito não apareceu. O que faço?",
    answer:
      "Pagamentos via PIX são processados em até 30 minutos. Se após esse período o depósito não aparecer, entre em contato conosco pelo formulário abaixo com o comprovante do pagamento.",
  },
];

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSendError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          message: message.trim(),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSendError(payload.error || "Não foi possível enviar sua mensagem agora.");
        return;
      }

      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      setTimeout(() => setSent(false), 5000);
    } catch {
      setSendError("Não foi possível enviar sua mensagem agora.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-brm-background relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brm-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brm-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <NextLink
            href={ROUTES.HOME}
            className="flex items-center gap-2 text-brm-text-secondary hover:text-brm-primary transition-colors font-display font-semibold text-sm uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </NextLink>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-4">
            <BRMLogo size="sm" animated={false} showText />
          </div>
          <h1 className="font-display font-black text-3xl text-brm-text-primary uppercase tracking-tight mb-2">
            <HelpCircle className="inline w-7 h-7 text-brm-primary mr-2 -mt-1" />
            Suporte
          </h1>
          <p className="text-brm-text-secondary">
            Encontre respostas ou entre em contato conosco.
          </p>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="font-display font-black text-lg text-brm-text-primary uppercase tracking-wide mb-4">
            Perguntas Frequentes
          </h2>

          <div className="space-y-2">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 overflow-hidden transition-colors hover:border-white/15"
              >
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                >
                  <span className="font-display font-bold text-sm text-brm-text-primary pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-brm-primary shrink-0 transition-transform duration-200 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 border-t border-white/5 pt-3">
                        <p className="text-sm text-brm-text-secondary leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="font-display font-black text-lg text-brm-text-primary uppercase tracking-wide mb-4">
            <MessageSquare className="inline w-5 h-5 text-brm-accent mr-2 -mt-0.5" />
            Fale Conosco
          </h2>

          <div className="bg-white/5 border border-white/10 p-6">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-display font-bold text-brm-text-primary uppercase">
                  Mensagem Enviada!
                </p>
                <p className="text-sm text-brm-text-secondary mt-1">
                  Responderemos o mais breve possível.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brm-text-muted uppercase tracking-wider font-bold">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (sendError) setSendError(null);
                      }}
                      placeholder="Seu nome"
                      required
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 text-brm-text-primary text-sm placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brm-text-muted uppercase tracking-wider font-bold">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brm-text-muted" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (sendError) setSendError(null);
                        }}
                        placeholder="seu@email.com"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 text-brm-text-primary text-sm placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent rounded-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-brm-text-muted uppercase tracking-wider font-bold">
                    Mensagem
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (sendError) setSendError(null);
                    }}
                    placeholder="Descreva sua dúvida ou problema..."
                    rows={4}
                    required
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 text-brm-text-primary text-sm placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent resize-none rounded-none"
                  />
                </div>

                {sendError && (
                  <div className="bg-red-500/10 border-l-2 border-red-500 px-3 py-2 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-400">{sendError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  isDisabled={isSending || !name.trim() || !email.trim() || !message.trim()}
                  isPending={isSending}
                  className="bg-brm-primary text-brm-primary-foreground font-display font-bold uppercase tracking-wider rounded-none cursor-pointer"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-brm-text-muted pb-8"
        >
          <p>
            Também pode nos contatar por e-mail:{" "}
            <a
              href="mailto:felipe.braat@outlook.com"
              className="text-brm-primary hover:text-brm-secondary transition-colors cursor-pointer"
            >
              felipe.braat@outlook.com
            </a>
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <NextLink href={ROUTES.ABOUT} className="hover:text-brm-primary transition-colors uppercase cursor-pointer">
              Sobre
            </NextLink>
            <span className="text-brm-primary/50">|</span>
            <NextLink href={ROUTES.LOGIN} className="hover:text-brm-primary transition-colors uppercase cursor-pointer">
              Login
            </NextLink>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
