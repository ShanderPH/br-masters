# Admin Panel — BR Masters

## Overview

Comprehensive admin panel accessible at `/admin` for users with the `admin` role. Provides full CRUD management for all major application entities with SofaScore API integration for importing tournament and match data.

## Architecture

### Route Protection

- **Server-side**: `src/app/admin/layout.tsx` verifies auth + role via Supabase before rendering
- **Middleware**: `src/proxy.ts` blocks unauthenticated users from `/admin/*` routes
- **API-level**: All admin API routes independently verify admin role

### Layout

- **AdminShell** (`src/components/admin/admin-shell.tsx`): Responsive sidebar with collapsible desktop view and mobile drawer
- Sidebar includes navigation for all 7 management panels + dashboard
- "Voltar ao App" button returns to the main application

### API Routes

| Route | Purpose |
|---|---|
| `/api/admin/crud` | Generic CRUD operations for all allowed tables |
| `/api/admin/sofascore` | SofaScore API integration (search, import, update) |

### Shared Hook

- `src/hooks/use-admin-crud.ts` — `useAdminCrud()` for CRUD operations, `useSofascoreApi()` for SofaScore calls

## Management Pages

### 1. Dashboard (`/admin`)

- Aggregate stats: users, matches, predictions, payments
- Prize pool overview
- Recent users and pending payments/deposits

### 2. User Management (`/admin/users`)

- Paginated user list with search by name
- Edit user: name, role, points, XP, level
- Delete users

### 3. Tournament Management (`/admin/tournaments`)

- Tournament list with card-based UI
- Season management per tournament
- **SofaScore Import**: Search and import tournaments, seasons, and teams from SofaScore API
- Edit tournament details (name, format, status, display order, featured flag)

### 4. Team Management (`/admin/teams`)

- Grid-based team cards with logos, colors, venue info
- Search and pagination
- Edit team details (name, code, country, venue, manager)

### 5. Match Management (`/admin/matches`)

- Match list with team logos, scores, status badges
- Filter by tournament, round, and status
- **SofaScore Import**: Import matches and update scores from SofaScore API
- Edit match details (round, status, scores, start time)

### 6. Scoring Management (`/admin/scoring`)

- User tournament points table with edit capability
- Recent predictions with pagination
- Edit predictions (points earned, correct/exact flags)
- Summary stats cards

### 7. Player Management (`/admin/players`)

- Player table with position badges, shirt numbers, market values
- Filter by name and position
- Edit player details (name, position, shirt number, height, foot, country)

### 8. Payment Management (`/admin/payments`)

- Tabs for withdrawals (saques) and deposits
- Status filter (pending, approved, rejected)
- **Approve/Reject** workflow with reason modal
- Summary cards with pending counts

## Tech Stack

- **UI**: HeroUI v3 (Card, Button, Modal, TextField, Tabs, etc.)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with project design system (brm-* colors, Barlow font)
- **Data**: Supabase via server/client SDK
- **External API**: SofaScore via RapidAPI

## Files Created/Modified

### New Files

- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/tournaments/page.tsx`
- `src/app/admin/teams/page.tsx`
- `src/app/admin/matches/page.tsx`
- `src/app/admin/scoring/page.tsx`
- `src/app/admin/players/page.tsx`
- `src/app/admin/payments/page.tsx`
- `src/components/admin/admin-shell.tsx`
- `src/components/admin/admin-dashboard-client.tsx`
- `src/app/api/admin/crud/route.ts`
- `src/app/api/admin/sofascore/route.ts`
- `src/hooks/use-admin-crud.ts`

### Modified Files

- `src/lib/supabase/types.ts` — Added missing table type definitions

## Known Lint Notes

- React Compiler lint about `setState in useEffect` — standard data-fetching pattern, safe at runtime
- `supabase as any` in CRUD route — required to break deep generic chain with dynamic table names (validated against allowlist)
