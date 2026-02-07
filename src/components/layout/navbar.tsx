"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Button, Dropdown, Label, Separator } from "@heroui/react";
import {
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  BarChart3,
  ChevronRight,
  Zap,
  Star,
  Trophy,
} from "lucide-react";
import { getUserLevelInfo, XP_PER_LEVEL } from "@/lib/services/xp-service";

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  isAuthenticated?: boolean;
  user?: {
    id?: string;
    name: string;
    points: number;
    xp?: number;
    level?: number;
    role?: "user" | "admin";
    favoriteTeamName?: string;
    favoriteTeamLogo?: string;
  } | null;
  onLogout?: () => void;
}

const navItems: NavItem[] = [
  { label: "Início", href: "/" },
  { label: "Partidas", href: "/partidas" },
  { label: "Ranking", href: "/ranking" },
  { label: "Palpites", href: "/palpites" },
];

export function Navbar({ isAuthenticated = false, user, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isDark = resolvedTheme === "dark";

  const isAdmin = user?.role === "admin";
  const userPoints = user?.points || 0;
  const userXP = user?.xp || 0;
  const userLevel = getUserLevelInfo(userXP, user?.level);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled
          ? "bg-brm-background/95 dark:bg-ea-dark/95 backdrop-blur-xl border-b border-white/10 shadow-xl"
          : "bg-transparent"
        }
      `}
    >
      {/* ================================================================== */}
      {/* MOBILE HEADER                                                       */}
      {/* ================================================================== */}
      <div className="md:hidden">
        {/* Top Bar: Logo + User */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
          {/* Logo */}
          <NextLink href="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 transition-transform group-hover:scale-105">
              <Image
                src="/images/brm-icon.svg"
                alt="BR Masters"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-black text-base tracking-tight uppercase text-brm-text-primary">
                BR Masters
              </span>
              <span className="text-[9px] font-semibold text-brm-primary uppercase tracking-[0.2em]">
                Palpites
              </span>
            </div>
          </NextLink>

          {/* User Area */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label="Alternar tema"
              onPress={() => setTheme(isDark ? "light" : "dark")}
              className="w-9 h-9"
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-brm-secondary" />
              ) : (
                <Sun className="w-4 h-4 text-brm-accent" />
              )}
            </Button>

            {isAuthenticated && user ? (
              <Dropdown>
                <Button
                  aria-label="Menu do usuário"
                  variant="ghost"
                  className="p-0 min-w-0 h-auto bg-transparent"
                >
                  {/* Mobile User Compact */}
                  <div className="flex items-center gap-1.5 bg-white/95 dark:bg-brm-card/95 px-2 py-1 -skew-x-12 shadow-lg border-b-2 border-brm-primary">
                    <div className="flex items-center gap-1.5 skew-x-12">
                      <div className="flex items-center gap-0.5 bg-brm-primary/20 text-brm-primary font-display font-bold px-1 py-0.5 text-[10px] rounded">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>{userLevel.level}</span>
                      </div>
                      <span className="font-display font-bold text-xs uppercase tracking-wide truncate max-w-[50px] text-brm-text-primary">
                        {user.name}
                      </span>
                      <div className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-brm-accent">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>{userPoints}</span>
                      </div>
                    </div>
                  </div>
                </Button>
                <Dropdown.Popover className="min-w-[260px] bg-brm-card/95 dark:bg-ea-dark/95 backdrop-blur-xl border border-white/10">
                  <Dropdown.Menu onAction={(key) => {
                    if (key === "logout") onLogout?.();
                  }}>
                    {/* Profile Header */}
                    <Dropdown.Item id="profile_header" textValue="Profile Header" className="cursor-default">
                      <div className="py-2">
                        <p className="font-display font-bold text-brm-text-primary text-base">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-bold uppercase ${userLevel.color}`}>
                            LVL {userLevel.level} • {userLevel.title}
                          </span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-white/10 overflow-hidden rounded-full">
                          <div
                            className={`h-full transition-all duration-500 ${userLevel.bgColor}`}
                            style={{ width: `${userLevel.progressPercent}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-brm-text-muted mt-1">
                          {XP_PER_LEVEL - userLevel.xpInLevel} XP para próximo nível
                        </p>
                      </div>
                    </Dropdown.Item>
                    <Separator className="my-1 bg-white/10" />
                    <Dropdown.Item id="profile" textValue="Meu Perfil" href="/profile">
                      <User className="w-4 h-4 mr-2" />
                      <Label>Meu Perfil</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="stats" textValue="Estatísticas" href="/stats">
                      <Trophy className="w-4 h-4 mr-2" />
                      <Label>Estatísticas</Label>
                    </Dropdown.Item>
                    {isAdmin && (
                      <>
                        <Separator className="my-1 bg-white/10" />
                        <Dropdown.Item id="admin" textValue="Painel Admin" href="/admin">
                          <Shield className="w-4 h-4 mr-2 text-brm-accent" />
                          <Label>Painel Admin</Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="scoring" textValue="Pontuação" href="/admin/scoring">
                          <BarChart3 className="w-4 h-4 mr-2 text-brm-secondary" />
                          <Label>Pontuação</Label>
                        </Dropdown.Item>
                      </>
                    )}
                    <Separator className="my-1 bg-white/10" />
                    <Dropdown.Item id="logout" textValue="Sair" variant="danger">
                      <LogOut className="w-4 h-4 mr-2" />
                      <Label>Sair da Conta</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : (
              <NextLink
                href="/login"
                className="flex items-center gap-2 px-4 py-2 font-display font-bold text-sm uppercase tracking-wider bg-brm-primary text-brm-primary-foreground transition-all duration-200 hover:bg-brm-secondary hover:text-brm-secondary-foreground -skew-x-12"
              >
                <span className="skew-x-12 inline-flex items-center gap-1">
                  Entrar
                  <ChevronRight className="w-4 h-4" />
                </span>
              </NextLink>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label="Menu de navegação"
              onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-brm-background/95 dark:bg-ea-dark/95 backdrop-blur-xl border-b border-white/10"
            >
              <ul className="flex flex-col py-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <NextLink
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={`
                          relative block px-6 py-3 font-display font-bold text-sm uppercase tracking-wide transition-all duration-200
                          ${isActive
                            ? "text-brm-primary bg-brm-primary/10"
                            : "text-brm-text-secondary hover:text-brm-text-primary hover:bg-white/5"
                          }
                        `}
                      >
                        <span className="flex items-center gap-2">
                          {item.label}
                          {isActive && (
                            <motion.span
                              layoutId="mobile-nav-indicator"
                              className="w-2 h-2 rounded-full bg-brm-primary"
                            />
                          )}
                        </span>
                      </NextLink>
                    </li>
                  );
                })}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* ================================================================== */}
      {/* DESKTOP HEADER                                                      */}
      {/* ================================================================== */}
      <div className="hidden md:block">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Logo + Navigation */}
            <div className="flex items-center gap-8 lg:gap-12">
              {/* Logo */}
              <NextLink href="/" className="flex items-center gap-3 group shrink-0">
                <div className="relative w-12 h-12 transition-transform group-hover:scale-105">
                  <Image
                    src="/images/brmasters.svg"
                    alt="BR Masters"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display font-black text-2xl tracking-tight uppercase text-brm-text-primary">
                    BR Masters
                  </span>
                  <span className="text-[10px] font-semibold text-brm-primary uppercase tracking-[0.25em]">
                    Palpites de Futebol
                  </span>
                </div>
              </NextLink>

              {/* Navigation */}
              <nav>
                <ul className="flex items-center gap-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href} className="relative group">
                        <NextLink
                          href={item.href}
                          className={`
                            relative block px-5 py-3 font-display font-bold text-base uppercase tracking-wide transition-all duration-200
                            ${isActive
                              ? "text-brm-text-primary"
                              : "text-brm-text-secondary hover:text-brm-text-primary"
                            }
                          `}
                        >
                          {item.label}
                          {/* Active Indicator - Skewed underline */}
                          <span
                            className={`
                              absolute bottom-1 left-2 right-2 h-[3px] bg-brm-primary transition-all duration-300 -skew-x-12 origin-left
                              ${isActive
                                ? "scale-x-100"
                                : "scale-x-0 group-hover:scale-x-100 opacity-50 group-hover:opacity-100"
                              }
                            `}
                          />
                        </NextLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* Right: Theme Toggle + User Area */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                aria-label="Alternar tema"
                onPress={() => setTheme(isDark ? "light" : "dark")}
                className="w-10 h-10"
              >
                {isDark ? (
                  <Moon className="w-5 h-5 text-brm-secondary" />
                ) : (
                  <Sun className="w-5 h-5 text-brm-accent" />
                )}
              </Button>

              {isAuthenticated && user ? (
                <Dropdown>
                  <Button
                    aria-label="Menu do usuário"
                    variant="ghost"
                    className="p-0 min-w-0 h-auto bg-transparent"
                  >
                    {/* Desktop User Parallelogram */}
                    <div className="flex items-center gap-3 bg-white/95 dark:bg-brm-card/95 px-5 py-2 -skew-x-12 shadow-lg shadow-black/20 border-b-3 border-brm-primary transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brm-primary/20">
                      <div className="flex items-center gap-4 skew-x-12">
                        {/* Level Box */}
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="bg-brm-background-dark dark:bg-ea-dark text-brm-text-primary font-display font-bold px-2 py-0.5 text-sm rounded flex items-center gap-1">
                            <Zap className="w-3 h-3 text-brm-secondary fill-brm-secondary" />
                            <span>LVL {userLevel.level}</span>
                          </div>
                          {/* XP Progress Bar */}
                          <div className="w-full h-1 bg-brm-text-muted/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brm-primary transition-all duration-300"
                              style={{ width: `${userLevel.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Name & Team */}
                        <div className="flex flex-col items-end leading-none">
                          <span className="font-display font-bold text-base uppercase tracking-wider text-brm-text-primary">
                            {user.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {user.favoriteTeamName && (
                              <span className="text-xs font-semibold text-brm-text-muted uppercase truncate max-w-[100px]">
                                {user.favoriteTeamName}
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-brm-primary font-semibold">
                              {userLevel.xpInLevel}/{XP_PER_LEVEL} XP
                            </span>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="flex items-center gap-1 text-xs font-mono font-bold text-brm-accent">
                          <Star className="w-4 h-4 text-brm-accent fill-brm-accent" />
                          <span>{userPoints.toLocaleString()}</span>
                        </div>

                        {/* Team Logo */}
                        {user.favoriteTeamLogo && (
                          <div className="relative w-10 h-10 rounded-full border-2 border-brm-primary overflow-hidden bg-brm-card shrink-0">
                            <Image 
                              src={user.favoriteTeamLogo} 
                              alt="Team Logo" 
                              fill
                              className="object-cover" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                  <Dropdown.Popover className="min-w-[300px] bg-brm-card/95 dark:bg-ea-dark/95 backdrop-blur-xl border border-white/10">
                    <Dropdown.Menu onAction={(key) => {
                      if (key === "logout") onLogout?.();
                    }}>
                      {/* Profile Header */}
                      <Dropdown.Item id="profile_header" textValue="Profile Header" className="cursor-default">
                        <div className="py-3 border-b border-white/10 mb-2">
                          <p className="font-display font-bold text-brm-text-primary text-lg">
                            {user.name}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-sm font-bold uppercase ${userLevel.color}`}>
                              LVL {userLevel.level} • {userLevel.title}
                            </span>
                            <span className="text-xs text-brm-text-muted">
                              {userPoints} pts
                            </span>
                          </div>
                          <div className="mt-3 h-1.5 w-full bg-white/10 overflow-hidden rounded-full">
                            <div
                              className={`h-full transition-all duration-500 ${userLevel.bgColor}`}
                              style={{ width: `${userLevel.progressPercent}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-brm-text-muted mt-1">
                            {XP_PER_LEVEL - userLevel.xpInLevel} XP para próximo nível
                          </p>
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item id="profile" textValue="Meu Perfil" href="/profile">
                        <User className="w-4 h-4 mr-2" />
                        <Label>Meu Perfil</Label>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                      </Dropdown.Item>
                      <Dropdown.Item id="stats" textValue="Estatísticas" href="/stats">
                        <Trophy className="w-4 h-4 mr-2" />
                        <Label>Estatísticas</Label>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                      </Dropdown.Item>
                      {isAdmin && (
                        <>
                          <Separator className="my-1 bg-white/10" />
                          <Dropdown.Item id="admin" textValue="Painel Admin" href="/admin">
                            <Shield className="w-4 h-4 mr-2 text-brm-accent" />
                            <Label>Painel Admin</Label>
                            <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                          </Dropdown.Item>
                          <Dropdown.Item id="scoring" textValue="Pontuação" href="/admin/scoring">
                            <BarChart3 className="w-4 h-4 mr-2 text-brm-secondary" />
                            <Label>Pontuação</Label>
                            <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                          </Dropdown.Item>
                        </>
                      )}
                      <Separator className="my-1 bg-white/10" />
                      <Dropdown.Item id="logout" textValue="Sair da Conta" variant="danger">
                        <LogOut className="w-4 h-4 mr-2" />
                        <Label>Sair da Conta</Label>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              ) : (
                <NextLink
                  href="/login"
                  className="flex items-center gap-2 px-6 py-3 font-display font-bold text-sm uppercase tracking-wider bg-brm-primary text-brm-primary-foreground transition-all duration-200 hover:bg-brm-secondary hover:text-brm-secondary-foreground hover:shadow-lg hover:shadow-brm-secondary/20 -skew-x-12"
                >
                  <span className="skew-x-12 inline-flex items-center gap-2">
                    Entrar
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </NextLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
