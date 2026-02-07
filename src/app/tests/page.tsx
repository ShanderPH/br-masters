"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Chip, Switch, Spinner, Skeleton } from "@heroui/react";
import { Sun, Moon, Palette, Zap, Trophy, Star, Users, Target } from "lucide-react";

export default function TestsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brm-background">
        <Spinner size="lg" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="min-h-screen bg-brm-background text-brm-text-primary transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-brm-primary rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-brm-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brm-text-primary">BR Masters</h1>
              <p className="text-xs text-brm-text-muted">Design System Test</p>
            </div>
          </motion.div>

          {/* Theme Toggle Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="secondary"
              size="lg"
              onPress={() => setTheme(isDark ? "light" : "dark")}
              className="gap-2 bg-brm-card hover:bg-brm-card-elevated transition-all duration-300"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "moon" : "sun"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? (
                    <Moon className="w-5 h-5 text-brm-secondary" />
                  ) : (
                    <Sun className="w-5 h-5 text-brm-accent" />
                  )}
                </motion.div>
              </AnimatePresence>
              <span className="hidden sm:inline">
                {isDark ? "Tema Escuro" : "Tema Claro"}
              </span>
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center py-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brm-primary via-brm-accent to-brm-secondary bg-clip-text text-transparent">
            HeroUI V3 + Tailwind V4
          </h2>
          <p className="text-lg text-brm-text-secondary max-w-2xl mx-auto">
            Demonstração completa do Design System BR Masters com suporte a temas claro e escuro,
            cores personalizadas e componentes HeroUI V3.
          </p>
        </motion.section>

        {/* Color Palette Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-6 h-6 text-brm-primary" />
            <h3 className="text-2xl font-bold">Paleta de Cores BR Masters</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorCard
              name="Primary"
              bgClass="bg-brm-primary"
              textClass="text-brm-primary-foreground"
              description="Turquoise"
            />
            <ColorCard
              name="Secondary"
              bgClass="bg-brm-secondary"
              textClass="text-brm-secondary-foreground"
              description="Electric Lime"
            />
            <ColorCard
              name="Accent"
              bgClass="bg-brm-accent"
              textClass="text-brm-accent-foreground"
              description="Magenta"
            />
            <ColorCard
              name="Purple"
              bgClass="bg-brm-purple"
              textClass="text-brm-purple-foreground"
              description="Deep Purple"
            />
            <ColorCard
              name="Card"
              bgClass="bg-brm-card"
              textClass="text-brm-text-primary"
              description="Elevated"
            />
            <ColorCard
              name="Background"
              bgClass="bg-brm-background-dark"
              textClass="text-brm-text-primary"
              description="Base"
            />
          </div>

          {/* EA FC Colors */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold mb-4 text-brm-text-secondary">EA FC Inspired</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <ColorCard name="EA Dark" bgClass="bg-ea-dark" textClass="text-white" small />
              <ColorCard name="EA Purple" bgClass="bg-ea-purple" textClass="text-white" small />
              <ColorCard name="EA Purple Light" bgClass="bg-ea-purple-light" textClass="text-white" small />
              <ColorCard name="EA Teal" bgClass="bg-ea-teal" textClass="text-black" small />
              <ColorCard name="EA Lime" bgClass="bg-ea-lime" textClass="text-black" small />
              <ColorCard name="EA Pink" bgClass="bg-ea-pink" textClass="text-white" small />
            </div>
          </div>
        </motion.section>

        {/* HeroUI Components Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-brm-secondary" />
            <h3 className="text-2xl font-bold">Componentes HeroUI V3</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-brm-card border border-white/10">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" /> Buttons
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="tertiary">Tertiary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </Card>

            <Card className="p-6 bg-brm-card border border-white/10">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" /> Chips
              </h4>
              <div className="flex flex-wrap gap-2">
                <Chip>Default</Chip>
                <Chip color="success">Success</Chip>
                <Chip color="warning">Warning</Chip>
                <Chip color="danger">Danger</Chip>
                <Chip color="accent">Accent</Chip>
                <Chip variant="secondary">Secondary</Chip>
              </div>
            </Card>

            <Card className="p-6 bg-brm-card border border-white/10">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Inputs
              </h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Digite seu nome"
                  className="w-full px-4 py-2 rounded-lg bg-brm-background-dark border border-white/10 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary"
                />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 rounded-lg bg-brm-background-dark border border-white/10 text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary"
                />
                <Switch defaultSelected>Notificações</Switch>
              </div>
            </Card>

            <Card className="p-6 bg-brm-card border border-white/10 md:col-span-2 lg:col-span-1">
              <h4 className="font-semibold mb-4">Navegação</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm">Partidas</Button>
                <Button variant="secondary" size="sm">Ranking</Button>
                <Button variant="tertiary" size="sm">Perfil</Button>
              </div>
              <p className="text-sm text-brm-text-secondary mt-4">
                Botões de navegação com variantes HeroUI V3.
              </p>
            </Card>

            <Card className="p-6 bg-brm-card border border-white/10">
              <h4 className="font-semibold mb-4">Loading States</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                </div>
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-brm-primary/20 to-brm-accent/20 border border-brm-primary/30">
              <h4 className="font-semibold mb-2 text-brm-primary">Card Customizado</h4>
              <p className="text-sm text-brm-text-secondary mb-4">
                Exemplo de card com gradiente e cores BR Masters.
              </p>
              <Button variant="primary" className="w-full">
                Ação Principal
              </Button>
            </Card>
          </div>
        </motion.section>

        {/* Responsive Test */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold mb-6">Teste de Responsividade</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 bg-brm-card border border-white/10">
                <div className="aspect-video bg-brm-background-dark rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-brm-text-muted">Card {i}</span>
                </div>
                <h5 className="font-medium">Título do Card</h5>
                <p className="text-sm text-brm-text-muted">
                  Descrição breve do conteúdo.
                </p>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-white/10">
          <p className="text-brm-text-muted text-sm">
            BR Masters © 2025 - HeroUI V3 + Tailwind V4 + Next.js 16
          </p>
        </footer>
      </main>
    </div>
  );
}

function ColorCard({
  name,
  bgClass,
  textClass,
  description,
  small = false,
}: {
  name: string;
  bgClass: string;
  textClass: string;
  description?: string;
  small?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`${bgClass} ${textClass} ${
        small ? "p-3" : "p-4"
      } rounded-lg shadow-lg transition-transform`}
    >
      <p className={`font-semibold ${small ? "text-xs" : "text-sm"}`}>{name}</p>
      {description && !small && (
        <p className="text-xs opacity-80">{description}</p>
      )}
    </motion.div>
  );
}
