# Page Loading Fix - Performance Optimization

## Date: 2026-03-18

## Problem
All pages in the application were experiencing extremely slow loading times (10+ seconds) or appearing to be stuck in an infinite loading state. The `/partidas` page was the most affected.

## Root Cause Analysis

### Primary Issue: Broken Client Mount Detection in `Providers.tsx`
The `Providers` component used `useSyncExternalStore` with an `emptySubscribe` function that **never notified React of state changes**:

```tsx
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

// During SSR: getServerSnapshot returns false → shows PageLoading
// During hydration: emptySubscribe never triggers re-render → PageLoading stays forever
```

In Next.js 16 App Router with RSC streaming, the hydration process doesn't trigger a synchronous re-render when `useSyncExternalStore`'s subscribe callback is a no-op. This caused `mounted` to remain `false` indefinitely, keeping the `PageLoading` overlay (with `fixed inset-0 z-9999`) on screen permanently.

### Secondary Issue: Sequential Supabase Queries
Multiple pages were making sequential Supabase queries instead of parallelizing them:
- `partidas/page.tsx`: 5 sequential queries + 4 batch queries in a loop
- `ranking/page.tsx`: 7 sequential queries
- `dashboard/page.tsx`: 2 sequential queries before the Promise.all batch

## Solution

### 1. Removed Broken Mount Gate from `Providers.tsx` (Session 1)
Replaced the broken `useSyncExternalStore` mount detection with a clean provider chain:
- `ThemeProvider` from `next-themes` already handles hydration mismatch internally
- `Suspense` boundary handles async loading of server components
- `NavigationLoadingProvider` handles loading states during page transitions

### 2. Replaced Blocking Loading Overlay with Progress Bar (Session 2)
The `NavigationLoadingProvider` was rendering `PageLoading` component as a full-screen overlay (`fixed inset-0 z-9999`) that **blocked all pointer events** during server-side rendering of the target page. This meant users couldn't interact with the app at all during navigation transitions.

**Fix**: Replaced the blocking `PageLoading` overlay with a non-blocking `NavigationProgressBar`:
- Thin gradient bar at the top of the viewport (3px height)
- Uses `pointer-events-none` so it never blocks user interaction
- Smooth progress animation (fast start, slow approach to 90%)
- 8-second safety timeout to auto-dismiss if navigation stalls
- Removed `AnimatePresence` and `PageLoading` imports from the provider

### 3. Parallelized Supabase Queries (Sessions 1 & 2)

**`partidas/page.tsx`**: All 8 queries in a single `Promise.all()`:
- `users`, `user_profiles`, `tournaments`, `tournament_seasons`, `upcoming_matches`, `recent_results`, `global_ranking`, `predictions`

**`ranking/page.tsx`**: 5 initial queries parallelized in `Promise.all()`

**`dashboard/page.tsx`**: 8 queries parallelized in `Promise.all()`

**`palpites/page.tsx`**: 5 initial queries parallelized in `Promise.all()`, plus `otherProfiles` and `otherUsersData` parallelized in a nested `Promise.all()`

**`profile/page.tsx`**: 4 queries parallelized in `Promise.all()` (`users`, `user_profiles`, `predictions count`, `scored predictions`)

**`classificacao/page.tsx`**: 4 queries parallelized in `Promise.all()` (`users`, `user_profiles`, `tournaments`, `tournament_seasons`)

## Results

| Metric | Before | After |
|--------|--------|-------|
| Server response time | ~10s | ~250ms |
| Page visible to user | Never (stuck on loading) | Instant |
| Client-side navigation | Blocked by overlay for seconds | Instant with progress bar |
| Sequential DB queries (palpites) | 7+ sequential | 5 parallel + 2 parallel |
| Sequential DB queries (profile) | 5+ sequential | 4 parallel + 1 dependent |
| Sequential DB queries (classificacao) | 4 sequential | 4 parallel |
| User interaction during navigation | Blocked (z-9999 overlay) | Always available |

## Files Modified
- `src/app/providers.tsx` - Removed broken mount detection gate
- `src/components/ui/navigation-loading-provider.tsx` - Replaced blocking PageLoading overlay with non-blocking NavigationProgressBar
- `src/app/partidas/page.tsx` - Parallelized all queries, removed batch loop
- `src/app/ranking/page.tsx` - Parallelized initial queries
- `src/app/dashboard/page.tsx` - Added user/profile queries to Promise.all
- `src/app/palpites/page.tsx` - Parallelized 5 initial queries + nested parallel queries
- `src/app/profile/page.tsx` - Parallelized 4 initial queries
- `src/app/classificacao/page.tsx` - Parallelized 4 initial queries

## Verification
- All pages tested via Playwright: `/login`, `/dashboard`, `/partidas`, `/ranking`, `/palpites`, `/profile`, `/classificacao`
- All client-side navigation transitions verified as instant
- Progress bar appears briefly during transitions without blocking interaction
- TypeScript compilation passes with zero errors
- No console errors in browser
