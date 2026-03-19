"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { CheckCircle2, AlertTriangle, MailCheck } from "lucide-react";

import { BRMLogo } from "@/components/ui/brm-logo";
import { ROUTES } from "@/lib/routes";

export default function CadastroConfirmadoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const confirmed = searchParams.get("confirmed") === "1";

  const content = useMemo(() => {
    if (confirmed) {
      return {
        title: "Conta Confirmada",
        description:
          "Sua inscrição foi confirmada com sucesso. Agora você já pode entrar no BR Masters e começar a competir.",
        accentClass: "text-brm-secondary",
        icon: <CheckCircle2 className="w-10 h-10 text-brm-secondary" />,
      };
    }

    return {
      title: "Confirmação Não Concluída",
      description:
        "Não foi possível validar o link de confirmação. Solicite um novo e-mail de validação para concluir seu cadastro.",
      accentClass: "text-red-400",
      icon: <AlertTriangle className="w-10 h-10 text-red-400" />,
    };
  }, [confirmed]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-brm-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,184,184,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(214,51,132,0.16)_0%,transparent_62%)]" />
        <div className="absolute top-[20%] left-[8%] w-56 h-56 border border-brm-primary/20 skew-card" />
        <div className="absolute bottom-[14%] right-[10%] w-48 h-48 border border-brm-secondary/20 skew-card" />
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-xl border border-white/15 bg-white/5 backdrop-blur-md"
        >
          <div className="border-b border-white/10 px-6 py-6 flex items-center justify-between">
            <BRMLogo size="sm" animated={false} showText />
            <div className="w-10 h-10 border border-white/15 bg-white/5 flex items-center justify-center">
              <MailCheck className="w-5 h-5 text-brm-primary" />
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 border border-white/15 bg-white/5 flex items-center justify-center">
                {content.icon}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-brm-text-muted font-bold">
                  Confirmação de Cadastro
                </p>
                <h1 className={`font-display font-black text-2xl uppercase ${content.accentClass}`}>
                  {content.title}
                </h1>
              </div>
            </div>

            <p className="text-sm text-brm-text-secondary leading-relaxed mb-8">{content.description}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onPress={() => router.push(ROUTES.LOGIN)}
                className="w-full rounded-none uppercase font-black tracking-wide bg-linear-to-r from-brm-primary to-brm-secondary text-black border-0 skew-card"
              >
                Fazer Login
              </Button>

              <Button
                variant="ghost"
                onPress={() => router.push(ROUTES.REGISTER)}
                className="w-full rounded-none uppercase font-black tracking-wide border border-white/20 text-brm-text-primary skew-card"
              >
                Voltar ao Cadastro
              </Button>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
