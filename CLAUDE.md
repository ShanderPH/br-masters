# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (Next.js 16 + Turbopack)
npm run build    # Production build
npm run lint     # ESLint check
npm start        # Production server
```

No test suite is configured. Lint before committing.

## Environment Variables

Copy `.env.example` to `.env.local`. Required vars:

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — mandatory
- `RAPIDAPI_KEY` / `RAPIDAPI_HOST` — optional (falls back to mock data without it)
- `BRASILEIRAO_TOURNAMENT_ID` / `BRASILEIRAO_SEASON_ID` — SofaScore IDs

## Architecture Overview

**Next.js 16 App Router** with Supabase SSR auth and a custom middleware file (`src/proxy.ts`, not `middleware.ts`) that handles route protection and session refresh.

### Auth Flow

- Users log in via numeric ID + password → Supabase `signInWithPassword`
- Sessions stored in HTTP-only cookies via `@supabase/ssr`
- `src/proxy.ts` guards all routes; public routes listed in `PUBLIC_ROUTES` array
- Three Supabase client factories: `lib/supabase/client.ts` (browser singleton), `lib/supabase/server.ts` (Server Components / API routes), `lib/supabase/middleware.ts` (proxy session update)

### Key Directories

- `src/app/` — App Router pages and API routes
- `src/components/` — UI split by domain: `auth/`, `bento-grid/`, `matches/`, `layout/`, `ui/`, `payments/`
- `src/hooks/` — Client hooks: `use-auth.ts`, `use-swipe-drag.ts`, `use-admin-crud.ts`, etc.
- `src/lib/services/` — Business logic: `xp-service.ts`, `scoring-config.ts`, `team-logo-service.ts`

### API Routes

- `/api/sofascore/standings` — Standings proxy with DB cache layer (Supabase RPCs `get_cached_standings`, `update_cached_standings`, `should_refresh_standings`). Falls back to mock data when API key is absent.
- `/api/team-logo/[id]` — Serves team logos dynamically

### Caching Strategy

Standings use a DB-backed cache in Supabase (not in-memory). The cache is invalidated when a match finishes, checked via `should_refresh_standings` RPC. HTTP headers expose cache status via `X-Cache` (`DB-HIT`, `DB-MISS`, `DB-STALE`, `MOCK`).

### Design System

FIFA/EA FC–inspired dark theme. Core CSS tokens defined in `src/app/globals.css`:

- `brm-background` (#1A1A2E), `brm-card` (#2C2C4E), `brm-primary` (#25B8B8 turquoise), `brm-secondary` (#CCFF00 lime), `brm-accent` (#D63384 magenta)
- Utility classes: `.glass`, `.geometric-card`, `.gradient-border`, `.skew-card`, `.glow-hover`
- Custom animations: `animate-float`, `animate-glow-pulse`, `animate-shimmer`, `animate-bounce-in`, `animate-sparkle`

Styling stack: Tailwind CSS v4 + HeroUI v3 (beta) + Framer Motion. Use `tailwind-variants` for component variants, `tailwind-merge` for conditional class merging.

### Database Schema (Supabase)

Key tables: `users_profiles`, `matches`, `predictions`, `user_tournament_points`, `teams`, `tournaments`, `tournament_seasons`, `current_round`, `prize_pool`. Full types in `src/lib/supabase/database.types.ts`.

### Scoring

- Exact score: 5 pts | Correct winner/draw: 2 pts | Miss: 0 pts
- XP and levels (Novato → Lenda) managed in `xp-service.ts`

## Routing

| Route | Auth required |
|-------|:---:|
| `/dashboard` | Yes |
| `/partidas` | Yes |
| `/ranking` | Yes |
| `/classificacao` | Yes |
| `/palpites` | Yes |
| `/profile` | Yes |
| `/login`, `/register`, `/about`, `/support`, `/tests` | No |
