# Tournament Integration with SofaScore API

## Overview

Complete integration of tournament data from the SofaScore API (via RapidAPI) into the BR Masters admin panel and main application. Supports three tournament formats: Liga (League), Mata-Mata (Knockout), and Misto (Mixed Groups + Knockout).

## Tournament Types

| Format | Example | Structure |
|--------|---------|-----------|
| **league** | Brasileirão (ID: 325) | Matches grouped by numbered rounds (1-38) |
| **knockout** | Copa do Brasil (ID: 373) | Matches grouped by named knockout rounds (Round of 16, QF, SF, Final) |
| **mixed** | Libertadores (ID: 384) | Group stage (rounds 1-6 with group names) + knockout stage |

## SofaScore API Endpoints (Working)

| Endpoint | Parameters | Description |
|----------|------------|-------------|
| `/tournaments/get-seasons` | `tournamentId` | List all seasons for a tournament |
| `/tournaments/get-rounds` | `tournamentId`, `seasonId` | Get round structure + current round |
| `/tournaments/get-matches` | `tournamentId`, `seasonId`, `pageIndex` | Get match events (30/page, paginated) |
| `/tournaments/get-standings` | `tournamentId`, `seasonId`, `type=total` | Get standings (single table or groups) |

## Data Structure Mapping

### SofaScore Event → matches table

| SofaScore Field | DB Column | Notes |
|-----------------|-----------|-------|
| `roundInfo.round` | `round_number` | Numeric round |
| `roundInfo.name` | `round_name` | Named knockout rounds (e.g., "Quarterfinals") |
| `roundInfo.cupRoundType` | `cup_round_type` | Knockout level (8=R16, 4=QF, 2=SF, 1=Final) |
| `tournament.groupName` | `group_name` | Group name for mixed format (e.g., "Group A") |
| `roundInfo.name ? "cup" : "league"` | `round_type` | Derived from presence of round name |

### Format Detection Logic

- Rounds with `name` property → knockout rounds
- Rounds without `name` → league/group rounds
- Both present → mixed format

## Database Changes

### Migrations Applied

1. **`add_group_name_to_matches`**: Added `group_name VARCHAR(50)` to `matches` table
2. **`add_season_id_to_predictions`**: Added `season_id INTEGER` to `predictions` table
3. **`add_season_id_to_user_tournament_points`**: Added `season_id INTEGER` to `user_tournament_points` table

### Data Updates

- Brasileirão (325): `season_id = 87678`, `format = 'league'`
- Copa do Brasil (373): `season_id = 89353`, `format = 'knockout'`
- Libertadores (384): `season_id = 87760`, `format = 'mixed'`
- `tournament_seasons` table populated for all three tournaments

## Admin Panel API Actions

### `POST /api/admin/sofascore`

| Action | Description |
|--------|-------------|
| `setup_tournament` | New! Takes `tournamentId` + `seasonId`, auto-detects format, creates tournament + seasons |
| `import_matches` | Fetches ALL matches via pagination, maps group_name + round info |
| `update_match_scores` | Fetches all events, updates finished match scores |
| `import_teams` | Extracts teams from standings (handles multiple groups for mixed format) |
| `get_rounds` | Returns round structure for a tournament/season |
| `get_seasons` | Returns available seasons for a tournament |
| `get_standings` | Returns raw standings data |
| `search_tournament` | Search SofaScore for tournaments by name |

## Admin Panel Changes

### Tournament Management (`/admin/tournaments`)

- **Add Tournament tab**: Enter Tournament ID + Season ID → auto-setup from SofaScore
- Format auto-detection with manual override option
- Tournament cards show format badges (Liga/Mata-Mata/Misto) with icons
- Per-tournament actions: Import Matches, Update Scores, Import Teams
- Season list display with current season indicator
- Search by name helper to find SofaScore IDs

### Match Management (`/admin/matches`)

- Match display shows contextual round info based on format
- Liga: Shows `R{number}` 
- Knockout: Shows round name (e.g., "Quarterfinals")
- Mixed group: Shows `{Group Name} R{number}`
- Import fetches all pages of matches (pagination support)

## Main App Changes

### Tournament Bento Card

- Fetches `season_id` from tournaments table
- Passes `tournament.id` as `sofascore_id` and `tournament.season_id` as `sofascore_season_id`
- Standings API called with correct tournament + season IDs

### Standings API (`/api/sofascore/standings`)

- Default season ID updated to `87678` (2026 season)
- Accepts `tournamentId` and `seasonId` query params

## Files Modified

- `src/app/api/admin/sofascore/route.ts` - Complete rewrite with correct API endpoints
- `src/app/admin/tournaments/page.tsx` - New setup workflow + format badges
- `src/app/admin/matches/page.tsx` - Group/round display + bulk import
- `src/components/bento-grid/tournament-card.tsx` - Proper season_id mapping
- `src/app/api/sofascore/standings/route.ts` - Updated default season ID
- `.env.local` - Updated season ID reference
