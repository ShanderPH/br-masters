export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/redefinir-senha",
  PROFILE: "/profile",
  DASHBOARD: "/dashboard",
  ABOUT: "/about",
  SUPPORT: "/support",
  CHECKOUT: "/checkout",
  RANKING: "/ranking",
  PARTIDAS: "/partidas",
  PALPITES: "/palpites",
  CLASSIFICACAO: "/classificacao",
  ADMIN: {
    ROOT: "/admin",
    USERS: "/admin/users",
    TOURNAMENTS: "/admin/tournaments",
    TEAMS: "/admin/teams",
    MATCHES: "/admin/matches",
    PREDICTIONS: "/admin/predictions",
    SCORING: "/admin/scoring",
    PLAYERS: "/admin/players",
    PAYMENTS: "/admin/payments",
  },
} as const;

export type AppRoute = (typeof ROUTES)[keyof Omit<typeof ROUTES, "ADMIN">];
export type AdminRoute = (typeof ROUTES.ADMIN)[keyof typeof ROUTES.ADMIN];
