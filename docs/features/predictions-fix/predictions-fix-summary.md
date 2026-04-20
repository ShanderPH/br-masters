# Fix: Predictions Not Displaying for Users

## Date: 2026-04-01

## Problem
User predictions were not being displayed or counted in:
- `/palpites` (user predictions tab)
- `/admin/predictions` (admin predictions page — only Felipe's showed)
- Ranking/dashboard prediction stats

## Root Cause
The `predictions` table stored **legacy Firebase IDs** in the `user_id` column (e.g., `"001"`, `"004"`) instead of Supabase auth UUIDs. The application code queries predictions using `user.id` (Supabase UUID), so **zero rows were returned** for every user.

Additionally:
- `predictions.user_id` was `varchar(10)` — too short for UUIDs (36 chars)
- `predictions.winner_team` column was named differently than what the code sent (`winner`)
- `user_tournament_points` and `user_round_points` tables also stored Firebase IDs
- Views (`tournament_rankings`, `general_ranking_with_tournaments`) joined on `firebase_id` 
- Missing DB functions: `increment_user_points`, `get_scoring_config`
- Type inconsistencies between integer/bigint DB columns and string TypeScript types

## Database Migrations Applied

### Migration 1: `fix_predictions_user_id_migration`
- Dropped FK constraint `fk_user` (pointed `user_id` → `users_profiles.firebase_id`)
- Widened `predictions.user_id` from `varchar(10)` to `varchar(36)` for UUIDs
- Widened `predictions.winner_team` from `varchar(10)` to `varchar(20)`
- Migrated all `predictions.user_id` from Firebase IDs to Supabase UUIDs
- Created `increment_user_points(p_user_id text, points_to_add integer)` function
- Created `get_scoring_config()` function returning scoring rules as JSONB

### Migration 2: `migrate_points_tables_and_recreate_views`
- Migrated `user_tournament_points.user_id` from Firebase IDs to UUIDs
- Migrated `user_round_points.user_id` from Firebase IDs to UUIDs
- Dropped and recreated `tournament_rankings` view (joins on UUID instead of `firebase_id`)
- Dropped and recreated `general_ranking_with_tournaments` view (joins on UUID)

## Code Changes

### `src/app/partidas/partidas-client.tsx`
- Fixed column name: `winner` → `winner_team` (matching DB column)
- Added `tournament_id` to prediction insert payload
- Removed unnecessary `String()` cast on `match_id` (DB expects bigint)

### `src/app/partidas/page.tsx`
- Fixed `predictionsMap` key: `String(pred.match_id)` to match string IDs from views

### `src/app/palpites/page.tsx`
- Consistent `String()` conversion for `match_id` in Map operations
- Consistent `String()` conversion for `tournament_id` in Set/filter operations
- Fixed `otherPredictions` match_id type to `number` (bigint from DB)
- Added `Number()` conversion when querying other predictions by match_id

## Verification
- All 10 users' predictions now correctly join with `users_profiles` via UUID
- `global_ranking` view returns correct data
- `tournament_rankings` view returns correct data with user names
- `recent_results` view shows correct prediction statistics
- Build passes cleanly (exit code 0)

## Supabase Project ID
`skqovtmmuqxatbyueras`
