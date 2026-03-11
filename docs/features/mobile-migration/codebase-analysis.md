# BR Masters — Codebase Analysis for React Native Migration

## 1. Project Architecture Overview

### Current Stack
- **Framework**: Next.js 16.1.5 (App Router, React 19, React Compiler)
- **UI Library**: HeroUI v3 beta (`@heroui/react`, `@heroui/styles`)
- **Styling**: Tailwind CSS v4 + CSS custom properties + `tailwind-variants` + `tailwind-merge`
- **Backend**: Supabase (Auth + Postgres + Realtime)
- **Animations**: framer-motion
- **Icons**: lucide-react
- **Language**: TypeScript (strict mode)
- **Deployment**: Netlify

### Route Map (App Router)
| Route | Type | Description |
|---|---|---|
| `/` | Server | Redirect → `/dashboard` or `/login` |
| `/login` | Client | Firebase ID-based login |
| `/dashboard` | Server+Client | BentoGrid dashboard with 6 cards |
| `/partidas` | Server+Client | Match list + prediction modal |
| `/palpites` | Server+Client | User predictions history by round |
| `/ranking` | Server+Client | General + tournament rankings with podium |
| `/classificacao` | Server+Client | League standings table (SofaScore API) |
| `/admin/*` | Server+Client | Admin CRUD panel (8 sub-pages) |
| `/api/admin/crud` | API | Generic CRUD endpoint |
| `/api/admin/sofascore` | API | SofaScore proxy |
| `/api/sofascore/standings` | API | Standings data |
| `/api/team-logo/[id]` | API | Team logo proxy |

### Authentication Flow
1. User selects name from search dropdown → gets `firebase_id` (format: `001`-`011`)
2. Enters numeric password
3. Backend constructs email: `user{firebase_id}@houseofguess.app`
4. Supabase `signInWithPassword` with constructed email + password
5. Session stored in cookies (SSR) / localStorage (client)
6. Middleware (`proxy.ts`) protects routes, redirects unauthenticated users

### State Management
- **No global store** — uses React local state + context
- `TournamentProvider` — shared tournament/season/round context for dashboard
- `useAuth` hook — auth state with session persistence
- `useAdminCrud` / `useSofascoreApi` hooks — API interaction
- Server Components fetch data, pass to Client Components as props

### Database Schema (Key Tables)
| Table | Purpose |
|---|---|
| `users_profiles` | User accounts, points, XP, level, role |
| `matches` | Match data (teams, scores, status, round) |
| `predictions` | User predictions per match |
| `tournaments` | Tournament metadata |
| `tournament_seasons` | Season config, current round |
| `user_tournament_points` | Per-tournament ranking with rank tracking |
| `prize_pool` | Prize pool totals |
| `payments` / `deposits` | Financial transactions |
| `teams` / `players` | Team and player data |
| `notifications` | User notifications |

---

## 2. Design System Tokens

### Color Palette
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--brm-primary` | `#25B8B8` | `#25B8B8` | Turquoise — primary actions, links |
| `--brm-secondary` | `#CCFF00` | `#CCFF00` | Electric lime — highlights, exact scores |
| `--brm-accent` | `#D63384` | `#D63384` | Magenta — points, danger |
| `--brm-purple` | `#4B3B7F` | `#4B3B7F` | Purple — general ranking |
| `--brm-background` | `#F5F5F7` | `#1A1A2E` | Page background |
| `--brm-background-dark` | `#E8E8EC` | `#12121F` | Darker background |
| `--brm-card` | `#FFFFFF` | `#2C2C4E` | Card surfaces |
| `--brm-card-elevated` | `#FAFAFA` | `#3A3A5E` | Elevated cards |
| `--brm-text-primary` | `#1A1A2E` | `#F0F0F0` | Primary text |
| `--brm-text-secondary` | `#6B6B8A` | `#A0A0B8` | Secondary text |
| `--brm-text-muted` | `#A0A0B8` | `#6B6B8A` | Muted text |

### EA FC Accent Colors
| Token | Value | Usage |
|---|---|---|
| `--color-ea-dark` | `#0f0e17` | Deep dark background |
| `--color-ea-purple` | `#2e0f3e` | Purple accent |
| `--color-ea-teal` | `#00f0ff` | Teal highlight |
| `--color-ea-lime` | `#ccff00` | Lime highlight |
| `--color-ea-pink` | `#ff0055` | Pink accent |

### Typography
- **Primary Font**: Barlow (400, 500, 600, 700, 800, 900)
- **Display**: `font-display` = Barlow
- **Body**: `font-sans` = Barlow + Geist Sans fallback
- **Mono**: Geist Mono
- **Style**: Uppercase, italic, bold — EA FC/FIFA inspired

### Spacing & Layout
- Mobile-first responsive: breakpoints at 480px, 640px, 768px, 1024px
- BentoGrid: 1 col → 2 col (480px) → 4 col (1024px)
- Standard padding: `px-2 sm:px-4 md:px-6`
- Card heights: 140px-460px depending on tile type

### Visual Patterns
- **Skewed parallelograms**: `-skew-x-3` to `-skew-x-12` on cards and buttons
- **Glass morphism**: `backdrop-blur-xl` + semi-transparent backgrounds
- **Gradient borders**: CSS mask-based gradient outlines
- **Diagonal stripes**: Repeating linear gradient patterns
- **Glow effects**: Box-shadow with primary color
- **Animated gradients**: 4-color shifting backgrounds

---

## 3. Component Inventory

### Layout Components
| Component | File | RN Equivalent |
|---|---|---|
| `Navbar` | `components/layout/navbar.tsx` | Tab navigator + header |
| `DashboardBackground` | `components/dashboard/dashboard-background.tsx` | LinearGradient + animated blobs |
| `PageTransition` | `components/ui/page-transition.tsx` | Screen transitions |

### Dashboard (BentoGrid)
| Component | File | Description |
|---|---|---|
| `BentoGrid` | `bento-grid/bento-grid.tsx` | Responsive grid container |
| `BentoTileWrapper` | `bento-grid/bento-grid.tsx` | Animated card wrapper with color themes |
| `TournamentCard` | `bento-grid/tournament-card.tsx` | Current tournament info |
| `NextMatchesCard` | `bento-grid/next-matches-card.tsx` | Upcoming matches with pagination |
| `RankingCard` | `bento-grid/ranking-card.tsx` | 3-view carousel ranking |
| `PrizePoolCard` | `bento-grid/prize-pool-card.tsx` | Prize pool display |
| `UserStatsCard` | `bento-grid/user-stats-card.tsx` | User statistics |
| `StandingsCard` | `bento-grid/standings-card.tsx` | League standings preview |

### Auth Components
| Component | File | Description |
|---|---|---|
| `LoginScreen` | `components/auth/login-screen.tsx` | Full login UI (mobile + desktop) |
| `UserSearchInput` | `components/auth/user-search-input.tsx` | User name search dropdown |

### Match Components
| Component | File | Description |
|---|---|---|
| `MatchCard` | `components/matches/match-card.tsx` | Individual match display |
| `PredictionModal` | `components/matches/prediction-modal.tsx` | Score prediction input |

### UI Primitives
| Component | File | Description |
|---|---|---|
| `BRMLogo` | `components/ui/brm-logo.tsx` | Animated logo |
| `ButtonLoadingDots` | `components/ui/button-loading-dots.tsx` | Loading indicator |
| `PageLoading` | `components/ui/page-loading.tsx` | Full-page loading screen |

### Context Providers
| Provider | File | Description |
|---|---|---|
| `TournamentProvider` | `components/dashboard/tournament-context.tsx` | Tournament/season/round state |
| `Providers` (ThemeProvider) | `app/providers.tsx` | Theme management |

---

## 4. Business Logic Summary

### XP & Level System
- 25 XP per level, 10 named levels (Novato → Lenda)
- Level > 10 becomes "Lenda N"
- Progress bar shows XP within current level

### Prediction System
- Users predict home/away scores for upcoming matches
- Winner determined: home/away/draw
- Points awarded for correct result, bonus for exact score
- Predictions locked after match starts
- Other users' predictions visible after match finishes

### Ranking System
- General ranking (all tournaments, all time)
- Per-tournament ranking with `current_rank` / `previous_rank` tracking
- Per-round ranking
- Rank change indicators (↑↓—)

### Tournament System
- Multiple active tournaments
- Auto-advance round when 90% of matches finished
- Season-based with current round tracking
- League format (points) and cup format (knockout)

### Admin System
- Generic CRUD via `/api/admin/crud` endpoint
- Role-based access (admin role in `users_profiles`)
- Payment/deposit approval workflows
- SofaScore data import

---

## 5. API Integration Points

### Supabase (Direct)
- Auth: `signInWithPassword`, `getUser`, `getSession`, `onAuthStateChange`
- DB: `users_profiles`, `matches`, `predictions`, `tournaments`, `tournament_seasons`, `prize_pool`
- Client-side singleton via `getSupabaseClient()`
- Server-side via `createClient()` with cookie-based auth

### SofaScore (via RapidAPI)
- Standings data: `/api/sofascore/standings`
- Team logos: `/api/team-logo/[id]`
- Admin data import: `/api/admin/sofascore`

### Internal API Routes
- `/api/admin/crud` — Generic CRUD with admin verification
- All API routes use server-side Supabase client

---

## 6. Platform-Specific Constraints

### Web-Only Patterns to Adapt
| Pattern | Web Implementation | RN Adaptation |
|---|---|---|
| CSS `backdrop-filter: blur()` | Glass morphism | `expo-blur` or opacity-based |
| CSS `transform: skewX()` | Parallelogram cards | Custom `transform` or SVG paths |
| CSS `mask-composite` | Gradient borders | `react-native-svg` LinearGradient |
| `next/image` | Optimized images | `Image` / `expo-image` |
| `next/link` | Client-side routing | React Navigation |
| `next/navigation` | `useRouter`, `usePathname` | React Navigation hooks |
| `next-themes` | Theme switching | Uniwind theme system |
| `framer-motion` | Animations | `react-native-reanimated` |
| CSS `@font-face` | Custom fonts | `expo-font` |
| CSS Grid | BentoGrid layout | `FlatList` / `FlexBox` |
| CSS `::before`/`::after` | Pseudo-elements | Additional `View` components |
| Server Components | SSR data fetching | API calls in `useEffect` / React Query |
| Cookies-based auth | SSR session | `@supabase/supabase-js` with AsyncStorage |
| `lucide-react` | SVG icons | `lucide-react-native` |
