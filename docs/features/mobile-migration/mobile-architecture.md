# BR Masters Mobile — Architecture & Migration Plan

## 1. Proposed Mobile Architecture

### Stack
- **Framework**: React Native (Expo SDK 53, managed workflow)
- **UI Library**: HeroUI Native (`heroui-native@1.0.0-rc.1`)
- **Styling**: Uniwind (Tailwind CSS for RN) + `tailwind-variants` + `tailwind-merge`
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + Zustand (lightweight global store)
- **Data Fetching**: TanStack Query (React Query) for server state
- **Backend**: Supabase JS client (same project `skqovtmmuqxatbyueras`)
- **Auth**: Supabase Auth with `@react-native-async-storage/async-storage`
- **Animations**: `react-native-reanimated` (HeroUI Native dependency)
- **Icons**: `lucide-react-native`
- **Fonts**: Barlow via `expo-font`
- **Images**: `expo-image` (optimized caching)

### Architectural Decisions

| Decision | Rationale |
|---|---|
| Expo managed workflow | Faster iteration, OTA updates, no native build complexity |
| Expo Router | File-based routing mirrors Next.js App Router mental model |
| TanStack Query | Replaces SSR data fetching; caching, refetching, optimistic updates |
| Zustand over Redux | Minimal boilerplate, matches existing lightweight state approach |
| HeroUI Native | Design system consistency with web app's HeroUI v3 |
| Uniwind | Tailwind CSS classes in RN, enabling design token reuse |

---

## 2. Folder Structure

```
br-masters-mobile/
├── app/                          # Expo Router (file-based routes)
│   ├── _layout.tsx               # Root layout (providers, fonts)
│   ├── index.tsx                 # Entry redirect
│   ├── (auth)/                   # Auth group (no tab bar)
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/                   # Main app (tab navigator)
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── index.tsx             # Dashboard
│   │   ├── partidas.tsx          # Matches + predictions
│   │   ├── palpites.tsx          # My predictions history
│   │   ├── ranking.tsx           # Rankings
│   │   └── classificacao.tsx     # League standings
│   └── (admin)/                  # Admin screens (stack)
│       ├── _layout.tsx
│       └── index.tsx
├── src/
│   ├── components/               # Shared components
│   │   ├── ui/                   # Atomic UI primitives
│   │   │   ├── brm-logo.tsx
│   │   │   ├── loading-screen.tsx
│   │   │   ├── skewed-card.tsx
│   │   │   ├── gradient-background.tsx
│   │   │   └── rank-badge.tsx
│   │   ├── auth/                 # Auth-specific components
│   │   │   ├── login-form.tsx
│   │   │   └── user-search-input.tsx
│   │   ├── dashboard/            # Dashboard components
│   │   │   ├── tournament-card.tsx
│   │   │   ├── next-matches-card.tsx
│   │   │   ├── ranking-card.tsx
│   │   │   ├── prize-pool-card.tsx
│   │   │   ├── user-stats-card.tsx
│   │   │   └── standings-card.tsx
│   │   ├── matches/              # Match-related components
│   │   │   ├── match-card.tsx
│   │   │   └── prediction-sheet.tsx
│   │   ├── ranking/              # Ranking components
│   │   │   ├── podium.tsx
│   │   │   ├── ranking-row.tsx
│   │   │   └── rank-change-indicator.tsx
│   │   └── standings/            # Standings components
│   │       ├── standings-table.tsx
│   │       └── zone-legend.tsx
│   ├── features/                 # Feature modules
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   │   └── use-auth.ts
│   │   │   ├── services/
│   │   │   │   └── auth-service.ts
│   │   │   └── types.ts
│   │   ├── predictions/
│   │   │   ├── hooks/
│   │   │   │   └── use-predictions.ts
│   │   │   ├── services/
│   │   │   │   └── prediction-service.ts
│   │   │   └── types.ts
│   │   ├── tournaments/
│   │   │   ├── hooks/
│   │   │   │   └── use-tournaments.ts
│   │   │   ├── providers/
│   │   │   │   └── tournament-provider.tsx
│   │   │   ├── services/
│   │   │   │   └── tournament-service.ts
│   │   │   └── types.ts
│   │   └── ranking/
│   │       ├── hooks/
│   │       │   └── use-ranking.ts
│   │       ├── services/
│   │       │   └── ranking-service.ts
│   │       └── types.ts
│   ├── lib/                      # Shared utilities
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client with AsyncStorage
│   │   │   ├── types.ts          # Database types (shared from web)
│   │   │   └── database.types.ts # Generated types
│   │   ├── services/
│   │   │   ├── team-logo-service.ts
│   │   │   └── xp-service.ts
│   │   └── utils/
│   │       ├── date.ts
│   │       └── format.ts
│   ├── stores/                   # Zustand stores
│   │   ├── auth-store.ts
│   │   └── app-store.ts
│   └── theme/                    # Design system
│       ├── colors.ts             # Color token constants
│       ├── typography.ts         # Font configuration
│       └── spacing.ts            # Spacing scale
├── assets/                       # Static assets
│   ├── fonts/
│   │   └── Barlow/               # Barlow font files
│   ├── images/
│   │   ├── logo/                 # Team logos (SVG)
│   │   ├── brm-icon.svg
│   │   └── brmasters.svg
│   └── splash.png
├── global.css                    # Uniwind + HeroUI Native styles + BRM theme
├── app.json                      # Expo config
├── metro.config.js               # Metro bundler config
├── babel.config.js               # Babel config (reanimated plugin)
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. Theming Configuration

### global.css — BR Masters Theme for HeroUI Native

```css
@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';
@source './node_modules/heroui-native/lib';

/* BR Masters Dark Theme (Default) */
@layer theme {
  @variant dark {
    --background: oklch(0.18 0.04 270);       /* #1A1A2E */
    --foreground: oklch(0.95 0.01 0);          /* #F0F0F0 */
    --surface: oklch(0.25 0.04 270);           /* #2C2C4E */
    --surface-foreground: oklch(0.95 0.01 0);
    --surface-secondary: oklch(0.30 0.04 270); /* #3A3A5E */
    --surface-secondary-foreground: oklch(0.95 0.01 0);
    --overlay: oklch(0.22 0.04 270);
    --overlay-foreground: oklch(0.95 0.01 0);
    --muted: oklch(0.50 0.03 270);             /* #6B6B8A */
    --default: oklch(0.25 0.04 270);
    --default-foreground: oklch(0.90 0.01 0);
    --accent: oklch(0.68 0.12 190);            /* #25B8B8 turquoise */
    --accent-foreground: oklch(0.18 0.04 270);
    --success: oklch(0.72 0.14 165);
    --success-foreground: oklch(0.95 0.01 0);
    --warning: oklch(0.90 0.20 110);           /* #CCFF00 lime */
    --warning-foreground: oklch(0.18 0.04 270);
    --danger: oklch(0.55 0.22 350);            /* #D63384 magenta */
    --danger-foreground: oklch(0.95 0.01 0);
    --separator: oklch(0.30 0.03 270);
    --border: oklch(0 0 0 / 0%);
    --focus: var(--accent);
    --link: oklch(0.68 0.12 190);
  }

  @variant light {
    --background: oklch(0.97 0.01 0);          /* #F5F5F7 */
    --foreground: oklch(0.18 0.04 270);        /* #1A1A2E */
    --surface: oklch(1.00 0 0);                /* #FFFFFF */
    --surface-foreground: oklch(0.18 0.04 270);
    --surface-secondary: oklch(0.98 0.005 0);  /* #FAFAFA */
    --surface-secondary-foreground: oklch(0.18 0.04 270);
    --overlay: oklch(0.99 0 0);
    --overlay-foreground: oklch(0.18 0.04 270);
    --muted: oklch(0.65 0.02 270);             /* #A0A0B8 */
    --default: oklch(0.94 0.01 0);
    --default-foreground: oklch(0.40 0.03 270);
    --accent: oklch(0.68 0.12 190);            /* #25B8B8 */
    --accent-foreground: oklch(1.00 0 0);
    --success: oklch(0.72 0.14 165);
    --success-foreground: oklch(0.25 0.08 165);
    --warning: oklch(0.90 0.20 110);           /* #CCFF00 */
    --warning-foreground: oklch(0.18 0.04 270);
    --danger: oklch(0.55 0.22 350);            /* #D63384 */
    --danger-foreground: oklch(1.00 0 0);
    --separator: oklch(0.92 0.01 0);
    --border: oklch(0 0 0 / 0%);
    --focus: var(--accent);
    --link: oklch(0.68 0.12 190);
  }
}

/* BR Masters custom color tokens */
@theme inline {
  --color-brm-primary: #25B8B8;
  --color-brm-secondary: #CCFF00;
  --color-brm-accent: #D63384;
  --color-brm-purple: #4B3B7F;
  --color-brm-background: var(--background);
  --color-brm-card: var(--surface);
  --color-brm-text-primary: var(--foreground);
  --color-brm-text-secondary: var(--muted);
  --color-ea-dark: #0f0e17;
  --color-ea-teal: #00f0ff;
  --color-ea-lime: #ccff00;
  --color-ea-pink: #ff0055;

  --font-normal: 'Barlow_400Regular';
  --font-medium: 'Barlow_500Medium';
  --font-semibold: 'Barlow_600SemiBold';
}
```

---

## 4. Navigation Architecture

### Tab Navigator (Main App)
```
(tabs)/
├── Dashboard (index)     → Home icon
├── Partidas              → Calendar icon
├── Palpites              → Target icon
├── Ranking               → Trophy icon
└── Classificação         → BarChart icon
```

### Stack Navigators
- **(auth)**: Login screen (no tabs)
- **(admin)**: Admin panel (stack, accessible from profile menu)

### Navigation Flow
```
App Launch
  ├── Check Supabase session (AsyncStorage)
  ├── Has session → (tabs)/index (Dashboard)
  └── No session → (auth)/login
```

---

## 5. Data Layer Strategy

### TanStack Query Keys
```typescript
const queryKeys = {
  user: ['user'] as const,
  matches: (tournamentId: number, round: number) => ['matches', tournamentId, round],
  predictions: (userId: string) => ['predictions', userId],
  ranking: (type: string, tournamentId?: number) => ['ranking', type, tournamentId],
  standings: (tournamentId: number, seasonId: number) => ['standings', tournamentId, seasonId],
  tournaments: ['tournaments'] as const,
  prizePool: ['prize-pool'] as const,
};
```

### Supabase Client (React Native)
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Important for RN
    },
  }
);
```

---

## 6. Component Migration Map

| Web Component | RN Component | Key Changes |
|---|---|---|
| `Navbar` | Tab Bar + Header | Bottom tabs replace top nav |
| `DashboardBackground` | `LinearGradient` + Reanimated | No CSS pseudo-elements |
| `BentoGrid` | `ScrollView` + `FlexBox` | No CSS Grid; use flex wrap |
| `BentoTileWrapper` | `SkewedCard` (custom) | `transform: [{skewX}]` |
| `LoginScreen` | `LoginForm` | Single layout (no desktop split) |
| `UserSearchInput` | `BottomSheet` + `FlatList` | Bottom sheet for search results |
| `PredictionModal` | `BottomSheet` | HeroUI Native BottomSheet |
| `MatchCard` | `MatchCard` (adapted) | `Pressable` + `Image` |
| `StandingsTable` | `FlatList` + custom rows | No HTML table |
| `framer-motion` animations | `Reanimated` | `FadeIn`, `SlideInDown`, etc. |
| `next/image` | `expo-image` | Cached image loading |
| `lucide-react` | `lucide-react-native` | Same icon names |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| HeroUI Native is RC (not stable) | Breaking changes possible | Pin exact version, wrap components |
| Uniwind is newer than NativeWind | Fewer community resources | Follow official docs, test thoroughly |
| Skew transforms in RN | Limited compared to CSS | Use `transform` array, test on both platforms |
| Glass morphism (backdrop-blur) | Not natively supported in RN | Use `expo-blur` BlurView or opacity fallback |
| CSS Grid → Flexbox | Layout complexity | Pre-calculate widths, use `Dimensions` API |
| Server Components → Client fetching | Initial load slower | TanStack Query prefetching, skeleton screens |
| Font rendering differences | Cross-platform inconsistency | Test on both iOS/Android, adjust line heights |
| SofaScore API (server-only) | Can't call from RN directly | Create Supabase Edge Function as proxy |
| Admin panel complexity | Large migration surface | Phase 2 — defer admin to web-only initially |

---

## 8. Migration Phases

### Phase 1 — Core (This Implementation)
- Project scaffold with Expo + HeroUI Native
- Auth flow (login/logout)
- Dashboard screen
- Matches + prediction flow
- My predictions history

### Phase 2 — Feature Parity
- Ranking screen with podium
- League standings
- Push notifications
- Profile/settings screen

### Phase 3 — Enhancement
- Admin panel (or keep web-only)
- Offline support
- Deep linking
- App Store submission
