"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NextLink from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import {
  Users,
  Trophy,
  Shield,
  Swords,
  BarChart3,
  UserRoundCog,
  CreditCard,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

interface AdminShellProps {
  user: {
    id: string;
    name: string;
    role: "admin";
  };
  children: React.ReactNode;
}

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Visão Geral",
    href: "/admin",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "users",
    label: "Usuários",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "tournaments",
    label: "Torneios",
    href: "/admin/tournaments",
    icon: <Trophy className="w-5 h-5" />,
  },
  {
    id: "teams",
    label: "Times",
    href: "/admin/teams",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "matches",
    label: "Partidas",
    href: "/admin/matches",
    icon: <Swords className="w-5 h-5" />,
  },
  {
    id: "predictions",
    label: "Palpites",
    href: "/admin/predictions",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    id: "scoring",
    label: "Pontuação",
    href: "/admin/scoring",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: "players",
    label: "Jogadores",
    href: "/admin/players",
    icon: <UserRoundCog className="w-5 h-5" />,
  },
  {
    id: "payments",
    label: "Pagamentos",
    href: "/admin/payments",
    icon: <CreditCard className="w-5 h-5" />,
  },
];

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleBackToApp = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-brm-background-dark flex">
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40
          bg-brm-card/95 dark:bg-[#12121F]/95 backdrop-blur-xl
          border-r border-white/5 transition-all duration-300
          ${collapsed ? "w-[72px]" : "w-[260px]"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/5">
          {!collapsed && (
            <NextLink href="/admin" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 transition-transform group-hover:scale-105">
                <Image
                  src="/images/brm-icon.svg"
                  alt="BR Masters"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-black text-sm tracking-tight uppercase text-brm-text-primary">
                  Admin
                </span>
                <span className="text-[8px] font-semibold text-brm-primary uppercase tracking-[0.15em]">
                  BR Masters
                </span>
              </div>
            </NextLink>
          )}
          {collapsed && (
            <div className="mx-auto relative w-8 h-8">
              <Image
                src="/images/brm-icon.svg"
                alt="BR Masters"
                fill
                className="object-contain"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onPress={() => setCollapsed(!collapsed)}
            className={`w-7 h-7 min-w-7 ${collapsed ? "mx-auto mt-2" : ""}`}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-brm-text-muted" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-brm-text-muted" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => {
            const active = isActive(item.href);
            return (
              <NextLink
                key={item.id}
                href={item.href}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  font-display font-semibold text-sm uppercase tracking-wide
                  transition-all duration-200 group
                  ${active
                    ? "bg-brm-primary/15 text-brm-primary"
                    : "text-brm-text-secondary hover:text-brm-text-primary hover:bg-white/5"
                  }
                  ${collapsed ? "justify-center px-0" : ""}
                `}
              >
                {active && (
                  <motion.div
                    layoutId="admin-sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brm-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`shrink-0 ${active ? "text-brm-primary" : "text-brm-text-muted group-hover:text-brm-text-primary"}`}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NextLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleBackToApp}
            className={`
              flex items-center gap-2 w-full px-3 py-2.5 rounded-lg
              font-display font-semibold text-xs uppercase tracking-wide
              text-brm-accent hover:bg-brm-accent/10 transition-all duration-200
              ${collapsed ? "justify-center px-0" : ""}
            `}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Voltar ao App</span>}
          </button>

          {!collapsed && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-white/5">
              <p className="text-[10px] font-semibold text-brm-text-muted uppercase tracking-wider">
                Logado como
              </p>
              <p className="text-xs font-display font-bold text-brm-text-primary truncate">
                {user.name}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-brm-card/95 dark:bg-[#12121F]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Menu"
            onPress={() => setMobileOpen(true)}
            className="w-9 h-9"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7">
              <Image
                src="/images/brm-icon.svg"
                alt="BR Masters"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-display font-black text-sm tracking-tight uppercase text-brm-text-primary">
              Admin
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Voltar ao App"
          onPress={handleBackToApp}
          className="w-9 h-9"
        >
          <ArrowLeft className="w-5 h-5 text-brm-accent" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 h-full w-[280px] z-50 bg-brm-card dark:bg-[#12121F] border-r border-white/5 flex flex-col"
            >
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-white/5">
                <NextLink
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="relative w-8 h-8">
                    <Image
                      src="/images/brm-icon.svg"
                      alt="BR Masters"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-display font-black text-sm tracking-tight uppercase text-brm-text-primary">
                      Admin
                    </span>
                    <span className="text-[8px] font-semibold text-brm-primary uppercase tracking-[0.15em]">
                      BR Masters
                    </span>
                  </div>
                </NextLink>
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label="Fechar menu"
                  onPress={() => setMobileOpen(false)}
                  className="w-8 h-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile Nav */}
              <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {sidebarItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <NextLink
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        relative flex items-center gap-3 px-3 py-3 rounded-lg
                        font-display font-semibold text-sm uppercase tracking-wide
                        transition-all duration-200
                        ${active
                          ? "bg-brm-primary/15 text-brm-primary"
                          : "text-brm-text-secondary hover:text-brm-text-primary hover:bg-white/5"
                        }
                      `}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brm-primary rounded-r-full" />
                      )}
                      <span className={active ? "text-brm-primary" : "text-brm-text-muted"}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </NextLink>
                  );
                })}
              </nav>

              {/* Mobile Sidebar Footer */}
              <div className="p-3 border-t border-white/5">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleBackToApp();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-3 rounded-lg font-display font-semibold text-xs uppercase tracking-wide text-brm-accent hover:bg-brm-accent/10 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar ao App</span>
                </button>
                <div className="mt-2 px-3 py-2 rounded-lg bg-white/5">
                  <p className="text-[10px] font-semibold text-brm-text-muted uppercase tracking-wider">
                    Logado como
                  </p>
                  <p className="text-xs font-display font-bold text-brm-text-primary">
                    {user.name}
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`
          flex-1 min-h-screen transition-all duration-300
          pt-14 lg:pt-0
          ${collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"}
        `}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
