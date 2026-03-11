# SofaScore Integration Fix - Match Import

## Date: March 2026

## Problem
The match import functionality was not working because the API route was trying to use SofaScore numeric IDs directly as database primary keys, but the database uses UUIDs for all IDs.

## Root Cause
- Database schema uses **UUIDs** for `matches.id`, `teams.id`, `tournaments.id`, `tournament_seasons.id`
- SofaScore API returns **integer IDs** for events, teams, tournaments, seasons
- The old code tried to insert SofaScore IDs directly into UUID columns, causing failures

## Solution
Implemented a mapping system using `sofascore_id` columns:

### Database Columns Used
- `teams.sofascore_id` - Maps SofaScore team ID to internal UUID
- `tournaments.sofascore_id` - Maps SofaScore tournament ID to internal UUID  
- `tournament_seasons.sofascore_season_id` - Maps SofaScore season ID to internal UUID
- `matches.sofascore_id` - Stores SofaScore event ID for reference

### API Route Changes (`src/app/api/admin/sofascore/route.ts`)

#### New Helper Functions
- `getBrazilCountryId(db)` - Gets or creates Brazil country record
- `getOrCreateTeam(db, sofascoreTeamId, teamName, teamCode, countryId)` - Looks up team by sofascore_id or creates new one
- `getExistingMatchByEventId(db, sofascoreEventId)` - Finds match by sofascore_id
- `mapSofascoreStatus(statusType)` - Converts SofaScore status to DB status

#### Updated Actions

**`import_matches`**
- Now requires both UUID IDs (`tournamentId`, `seasonId`) and SofaScore IDs (`sofascoreTournamentId`, `sofascoreSeasonId`)
- Looks up or creates teams by `sofascore_id`
- Creates matches with auto-generated UUIDs, stores `sofascore_id` for reference
- Returns `{ total, inserted, updated, errors, roundNumbers, pastCount, futureCount }`

**`import_round_matches`**
- Same parameter structure as `import_matches`
- Filters events by round number before importing

**`update_match_scores`**
- Uses `sofascore_id` to find matches to update
- Returns `{ updated, notFound, total }`

**`calculate_scores`**
- Uses UUID `tournamentId` and `seasonId` for database queries
- Updates `predictions.is_correct_result` and `predictions.is_exact_score`
- Accumulates user points

**`import_teams`**
- Uses `sofascoreTournamentId` and `sofascoreSeasonId` for API calls
- Creates/updates teams with `sofascore_id` mapping

**`get_rounds`, `get_seasons`, `get_standings`**
- Now use `sofascoreTournamentId` and `sofascoreSeasonId` parameters

### Admin Page Changes (`src/app/admin/matches/page.tsx`)

- Added `SeasonOption` interface with `sofascore_season_id`
- Added `sofascore_id` to `TournamentOption` interface
- Added `seasons` state and `fetchSeasons` function
- Tournament select now shows SofaScore ID
- Season select dropdown replaces manual ID input
- All import handlers pass both UUID and SofaScore IDs

## Database State
- **Tournament**: Campeonato Brasileiro Série A (UUID: `ea091417-29fb-4222-8e09-297e538c5239`, sofascore_id: 325)
- **Season**: 2026 (UUID: `e12431c3-0baf-4129-8559-5be9f22073b8`, sofascore_season_id: 87678)
- **Teams**: 25 teams with sofascore_id mapped
- **Matches**: 0 (cleared for fresh import)

## Usage
1. Go to Admin > Partidas > Import tab
2. Select tournament (shows SofaScore ID)
3. Select season (auto-loads, shows SofaScore season ID)
4. Click "Importar Todas" or enter round number and click "Importar Rodada"
5. Use "Atualizar Placares" to sync finished match scores
6. Use "Calcular Pontuação" to score predictions

## Supabase Project ID
`jovrevgiyxdmhdhhcwrn`
