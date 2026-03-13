"use client";

import NextLink from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Users,
  BarChart3,
  Shield,
  ArrowLeft,
  Zap,
  Star,
} from "lucide-react";

import { BRMLogo } from "@/components/ui/brm-logo";
import { ROUTES } from "@/lib/routes";

const features = [
  {
    icon: <Target className="w-6 h-6" />,
    title: "Palpites",
    description: "Faça seus palpites para cada rodada do Brasileirão e acumule pontos.",
    color: "text-brm-primary",
    bg: "bg-brm-primary/10",
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Ranking",
    description: "Escale o ranking e dispute prêmios por torneio, rodada ou partida.",
    color: "text-brm-secondary",
    bg: "bg-brm-secondary/10",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Estatísticas",
    description: "Acompanhe suas estatísticas, taxa de acerto e evolução ao longo do campeonato.",
    color: "text-brm-accent",
    bg: "bg-brm-accent/10",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Comunidade",
    description: "Desafie seus amigos e compare resultados em tempo real.",
    color: "text-brm-purple",
    bg: "bg-brm-purple/10",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Crie sua conta",
    description: "Cadastre-se gratuitamente e escolha seu time do coração.",
  },
  {
    step: "02",
    title: "Faça seus palpites",
    description: "Antes de cada rodada, registre seus palpites para as partidas.",
  },
  {
    step: "03",
    title: "Acumule pontos",
    description: "Ganhe pontos por acertar resultados e placares exatos.",
  },
  {
    step: "04",
    title: "Dispute prêmios",
    description: "Os melhores palpiteiros de cada rodada e torneio ganham prêmios.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brm-background relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brm-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brm-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brm-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
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
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <BRMLogo size="md" animated showText />
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-brm-text-primary uppercase tracking-tight mb-3">
            Sobre o BR Masters
          </h1>
          <p className="text-brm-text-secondary max-w-xl mx-auto">
            A plataforma definitiva de palpites do futebol brasileiro. Prove que você é um
            verdadeiro mestre do Brasileirão.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              <div className={`w-12 h-12 ${feature.bg} ${feature.color} flex items-center justify-center mb-3`}>
                {feature.icon}
              </div>
              <h3 className="font-display font-bold text-brm-text-primary uppercase tracking-wide mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-brm-text-secondary">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="font-display font-black text-xl text-brm-text-primary uppercase tracking-wide mb-6 text-center">
            <Zap className="inline w-5 h-5 text-brm-secondary mr-2" />
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="bg-white/5 border border-white/10 p-5 text-center"
              >
                <span className="font-display font-black text-3xl text-brm-primary/30">
                  {item.step}
                </span>
                <h4 className="font-display font-bold text-brm-text-primary uppercase text-sm mt-2 mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-brm-text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Scoring system */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 p-6 mb-12"
        >
          <h2 className="font-display font-black text-xl text-brm-text-primary uppercase tracking-wide mb-4">
            <Star className="inline w-5 h-5 text-brm-accent mr-2" />
            Sistema de Pontuação
          </h2>
          <div className="space-y-3 text-sm text-brm-text-secondary">
            <div className="flex items-center gap-3">
              <span className="w-10 text-center font-display font-black text-brm-secondary text-lg">+10</span>
              <span>Acerto exato do placar (ex: 2×1 → 2×1)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-10 text-center font-display font-black text-brm-primary text-lg">+5</span>
              <span>Acerto do resultado (vitória/empate/derrota)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-10 text-center font-display font-black text-brm-text-muted text-lg">+0</span>
              <span>Palpite incorreto</span>
            </div>
          </div>
        </motion.div>

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-brm-text-muted space-y-2 pb-8"
        >
          <p>
            <Shield className="inline w-3 h-3 mr-1" />
            BR Masters © 2026 — Todos os direitos reservados.
          </p>
          <p>
            Desenvolvido com{" "}
            <span className="text-brm-accent">♥</span> para os amantes do futebol brasileiro.
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <NextLink href={ROUTES.SUPPORT} className="hover:text-brm-primary transition-colors uppercase cursor-pointer">
              Suporte
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
