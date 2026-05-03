# PROMPT 3 — DB Executor: Restore Predictions (Rebound)

**Model:** Claude Sonnet 4.6
**Phase:** Mutating prod. Single transaction. Idempotent.
**Reads:** `00-context.md`, `forensics.json`, `match-2026-05-02.json`

## Goal

Re-insert the lost predictions into prod, rebound from the OLD `match_id` (deleted UUID) to the NEW `match_id` (restored UUID). Match itself already exists in prod.

## Inputs

- `OLD_MATCH_UUID` = `deleted_match.id` from dump
- `NEW_MATCH_UUID` = `forensics.json.restored_match_uuid`
- `predictions[]` from dump

## Pre-flight checks

```sql
-- restored match exists with status finished
SELECT id, status, home_score, away_score FROM matches WHERE id = '<NEW_MATCH_UUID>';
-- expect 1 row, status='finished', scores not null

-- no predictions yet on new match
SELECT count(*) FROM predictions WHERE match_id = '<NEW_MATCH_UUID>';
-- expect 0
```

If either fails: STOP, report.

## Migration (apply via `apply_migration`, name `restore_predictions_match_atletico_gremio_2026_05_02`)

```sql
BEGIN;

-- Capture pre-state for QA (count of all predictions, untouched matches checksum sample)
-- (Optional: the executor may emit these to a temp table or just rely on ai-system/recovery snapshots taken outside the txn.)

INSERT INTO predictions (
  id, user_id, match_id,
  home_team_goals, away_team_goals, winner,
  created_at, updated_at
) VALUES
  -- One row per prediction from dump. match_id REPLACED with NEW_MATCH_UUID.
  ('<orig_pred_id_1>', '<user_1>', '<NEW_MATCH_UUID>', <h1>, <a1>, '<winner_1>', '<created_at_1>', NOW()),
  ('<orig_pred_id_2>', '<user_2>', '<NEW_MATCH_UUID>', <h2>, <a2>, '<winner_2>', '<created_at_2>', NOW())
  -- ...
ON CONFLICT (id) DO NOTHING;

-- Verify count
DO $$
DECLARE expected INT := <N from dump>;
DECLARE actual INT;
BEGIN
  SELECT count(*) INTO actual FROM predictions WHERE match_id = '<NEW_MATCH_UUID>';
  IF actual <> expected THEN
    RAISE EXCEPTION 'Restore count mismatch: actual % expected %', actual, expected;
  END IF;
END $$;

-- Verify no prediction was created AFTER match start_time (would mean late bet, invalid)
DO $$
DECLARE bad INT;
BEGIN
  SELECT count(*) INTO bad FROM predictions p
  JOIN matches m ON m.id = p.match_id
  WHERE p.match_id = '<NEW_MATCH_UUID>' AND p.created_at > m.start_time;
  IF bad > 0 THEN
    RAISE EXCEPTION 'Found % predictions with created_at after match start_time', bad;
  END IF;
END $$;

COMMIT;
```

## Edge cases

- If the unique constraint is `(user_id, match_id)`: a user with an existing (post-restore manual) prediction on `NEW_MATCH_UUID` would conflict. Handle with `ON CONFLICT (user_id, match_id) DO NOTHING` AND log skipped rows to `ai-system/recovery/skipped.json` for human review. Do not silently overwrite.
- If `predictions.id` collides with another existing prediction (different match): impossible (UUIDs), but `ON CONFLICT (id) DO NOTHING` covers it.
- If the dump contains predictions where `created_at > restored_match.start_time`: STOP — likely wrong dump or wrong match row. Report.

## Output

- Migration file path
- Inserted count, skipped count
- Pre/post `count(*) FROM predictions` (whole table) — must differ exactly by inserted count
- Confirmation `count WHERE match_id = NEW` matches dump

## Hard rules

- Do NOT update the `matches` row (already correct).
- Do NOT touch counters here (Prompt 4 owns that).
- Single transaction. Rollback on any failure.
