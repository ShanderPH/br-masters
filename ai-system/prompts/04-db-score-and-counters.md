# PROMPT 4 — DB Executor: Score Recovered Predictions + Reconcile Counters

**Model:** Claude Sonnet 4.6
**Phase:** Mutating prod. Affects `user_profiles`, `user_tournament_points`.
**Reads:** `00-context.md`, `forensics.json`

## Goal

Match is `finished` with real score. Recovered predictions never went through scoring. Apply scoring + sync denormalized counters for affected users only.

## Scoring rules

| Outcome | Points |
|---------|-------:|
| Exact score (`home_team_goals == final_home AND away_team_goals == final_away`) | 5 |
| Correct winner/draw only | 2 |
| Miss | 0 |

`winner` derivation:
- `final_home > final_away` → `home`
- `final_home < final_away` → `away`
- equal → `draw`

## Inputs

- `NEW_MATCH_UUID` from forensics
- Final scores from forensics: `restored_match_home_score`, `restored_match_away_score`

## Step 1 — confirm scoring engine column shape

Inspect `predictions` row for an existing `points_awarded` / `is_correct` / `is_exact` column. If a column like `predictions.points_awarded` exists, populate it. Otherwise, scoring lives only in aggregates — skip per-row update and only touch aggregates.

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'predictions';
```

Adapt the migration below based on the actual columns. Do **not** add new columns here.

## Step 2 — Migration `score_recovered_predictions_atletico_gremio_2026_05_02`

```sql
BEGIN;

-- Constants
WITH match_result AS (
  SELECT id, home_score, away_score,
    CASE
      WHEN home_score > away_score THEN 'home'
      WHEN home_score < away_score THEN 'away'
      ELSE 'draw'
    END AS actual_winner
  FROM matches WHERE id = '<NEW_MATCH_UUID>'
),
scored AS (
  SELECT p.id AS prediction_id,
         p.user_id,
         CASE
           WHEN p.home_team_goals = m.home_score AND p.away_team_goals = m.away_score THEN 5
           WHEN p.winner::text = m.actual_winner THEN 2
           ELSE 0
         END AS pts,
         (p.home_team_goals = m.home_score AND p.away_team_goals = m.away_score) AS is_exact,
         (p.winner::text = m.actual_winner) AS is_correct
  FROM predictions p
  JOIN match_result m ON m.id = p.match_id
  WHERE p.match_id = '<NEW_MATCH_UUID>'
)
-- (a) optional per-row update if column exists
-- UPDATE predictions p SET points_awarded = s.pts FROM scored s WHERE p.id = s.prediction_id;

-- (b) aggregate updates per user
, user_deltas AS (
  SELECT user_id,
         sum(pts) AS pts_delta,
         sum(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_delta,
         sum(CASE WHEN is_exact THEN 1 ELSE 0 END) AS exact_delta,
         count(*) AS preds_delta
  FROM scored GROUP BY user_id
)
UPDATE user_profiles up
SET total_points = up.total_points + ud.pts_delta,
    correct_predictions = up.correct_predictions + ud.correct_delta,
    exact_score_predictions = up.exact_score_predictions + ud.exact_delta,
    -- predictions_count: the prediction row already exists post-Prompt-3, so count was likely wrong before.
    -- Re-derive instead of delta to be safe:
    predictions_count = (SELECT count(*) FROM predictions WHERE user_id = ud.user_id),
    updated_at = NOW()
FROM user_deltas ud
WHERE up.id = ud.user_id;

-- (c) user_tournament_points
INSERT INTO user_tournament_points (user_id, tournament_id, season_id, points, predictions_count, correct_predictions, exact_score_predictions, updated_at)
SELECT ud.user_id,
       '<tournament_uuid>',
       '<season_uuid>',
       ud.pts_delta,
       ud.preds_delta,
       ud.correct_delta,
       ud.exact_delta,
       NOW()
FROM user_deltas ud
ON CONFLICT (user_id, tournament_id, season_id) DO UPDATE
SET points = user_tournament_points.points + EXCLUDED.points,
    predictions_count = user_tournament_points.predictions_count + EXCLUDED.predictions_count,
    correct_predictions = user_tournament_points.correct_predictions + EXCLUDED.correct_predictions,
    exact_score_predictions = user_tournament_points.exact_score_predictions + EXCLUDED.exact_score_predictions,
    updated_at = NOW();

-- XP / level: if xp-service.ts logic lives in app code only, leave xp/level alone here and trigger app-side recompute.
-- If a SQL function exists (e.g. recompute_user_xp(uuid)), call it for each affected user_id.

COMMIT;
```

## Step 3 — verify

```sql
-- Sanity: sum of points awarded matches sum delta
-- Sanity: every affected user's predictions_count == real count
SELECT up.id, up.predictions_count, (SELECT count(*) FROM predictions p WHERE p.user_id = up.id) AS actual
FROM user_profiles up
WHERE up.id IN (<affected user list>)
  AND up.predictions_count <> (SELECT count(*) FROM predictions p WHERE p.user_id = up.id);
-- expect 0 rows
```

## Output

- Migration file
- Affected user count, total points awarded, count of exact / correct / miss
- Verification query result (must be empty)

## Hard rules

- Touch only users who had a recovered prediction.
- Do NOT recompute everyone's totals from scratch.
- Schema unknowns → inspect before writing; do not invent columns.
- If `xp-service.ts` is the source of truth for XP/level, do NOT update those columns here. Note it in output for app-side reconcile.
