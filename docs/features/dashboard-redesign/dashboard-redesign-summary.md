# Dashboard Redesign & Backend Integration

## Overview

Comprehensive redesign of the BR Masters dashboard, including responsive BentoGrid layout, shared tournament context, card refactors with backend integration, page transitions, and ranking page redesign.

## Changes

### 1. Database Migrations

- **`user_tournament_points`**: Added `previous_rank` (integer, nullable) and `current_rank` (integer, nullable) columns for rank change tracking.
- **`user_round_points`**: New table for round-based points tracking with columns: `id`, `user_id`, `tournament_id`, `round_number`, `points`, `created_at`, `updated_at`. Unique constraint on `(user_id, tournament_id, round_number)`.

### 2. TournamentProvider Context

**File**: `src/components/dashboard/tournament-context.tsx`

Shared React context providing cross-card tournament state:
- Fetches active tournaments and their seasons from Supabase
- Computes current round based on match completion (auto-advances when ≥90% of matches in a round are finished)
- Exposes: `tournaments`, `currentTournament`, `currentSeason`, `computedRound`, `isLoading`, `setCurrentTournamentIndex`
- Exported via `src/components/dashboard/index.ts`

### 3. BentoGrid Layout

**File**: `src/components/bento-grid/bento-grid.tsx`

- Standardized heights: top section (FeatureTile + VerticalTiles) and bottom section (StandardTiles)
- Responsive breakpoints at 480px for mobile
- Tile variants: `FeatureTile`, `VerticalTile`, `WideTile`, `StandardTile`
- Consistent gradient system and border colors per theme
- Color themes: `teal`, `purple`, `blue`, `lime`, `gold`

### 4. Tournament Card

**File**: `src/components/bento-grid/tournament-card.tsx`

- Consumes `TournamentProvider` context instead of internal data fetching
- Fetches standings from `/api/sofascore/standings` based on context tournament/season
- Navigation between multiple tournaments via context
- Auto-round display from computed round

### 5. Next Matches Card

**File**: `src/components/bento-grid/next-matches-card.tsx`

- Linked to `TournamentProvider` context for filtering by tournament and round
- Client-side pagination (4 matches per page) with dot indicators
- Uses shared `team-logo-service` for logo resolution
- Displays round number in subtitle
- Reads match data directly from denormalized DB columns (no separate team lookups)

### 6. Ranking Card

**File**: `src/components/bento-grid/ranking-card.tsx`

- Three carousel views: General, Tournament, Round rankings
- Fetches from `user_tournament_points` and `user_round_points` tables
- `RankChangeIndicator` component using `previous_rank` from DB
- Auto-play carousel with pause on hover
- Color-coded dot indicators per view type

### 7. Standings Card

**File**: `src/components/bento-grid/standings-card.tsx`

- Redesigned with gold theme and skewed icon container
- Links to `/classificacao` page
- Matches design system (parallelogram elements)

### 8. User Stats Card

**File**: `src/components/bento-grid/user-stats-card.tsx`

- No structural changes; already follows design system

### 9. Dashboard Client

**File**: `src/app/dashboard/dashboard-client.tsx`

- Wrapped with `TournamentProvider` for shared state
- Tightened animation delays for faster perceived load
- Improved mobile padding

### 10. Page Transition

**File**: `src/components/ui/page-transition.tsx`

- Uses `framer-motion` `AnimatePresence` keyed on pathname
- Fade + slide animation on route changes
- No setState-in-effect issues

### 11. Team Logo Service

**File**: `src/lib/services/team-logo-service.ts`

- Centralized team logo path generation
- Maps team names to SVG filenames
- Slug fallback for unmapped teams
- `getTeamLogoPathById` for API-based logo fetching

### 12. Ranking Page (`/ranking`)

**Files**: `src/app/ranking/page.tsx`, `src/app/ranking/ranking-client.tsx`

- Dynamic tournament tabs fetched from DB (no hardcoded IDs)
- Podium with skewed cards matching design system
- Rank change indicators for tournament views
- `DashboardBackground` for visual consistency
- Back navigation to dashboard
- `AnimatePresence` for filter transitions
- Uses `users_profiles` table (matching generated Supabase types)

## Architecture Decisions

- **Shared Context over Prop Drilling**: TournamentProvider enables cross-card communication without prop chains
- **Denormalized Match Data**: Matches table includes team names/logos directly, avoiding N+1 queries
- **Client-side Pagination**: For small datasets (≤20 matches per round), client pagination is simpler and faster
- **Type Assertions**: Used explicit type casts for Supabase queries where generated types don't match actual schema (e.g., `user_profiles` vs `users_profiles`)

## Design System Compliance

- Barlow font (`font-display`) throughout
- Skewed parallelogram elements (`-skew-x-3`, `-skew-x-6`)
- Color palette: Primary #25B8B8, Secondary #CCFF00, Accent #D63384, Purple #4B3B7F
- EA FC/FIFA inspired dark theme
- Responsive: mobile-first with breakpoints at 480px, 640px, 768px, 1024px
