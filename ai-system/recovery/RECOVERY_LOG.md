# Recovery Log — Athletico-PR vs Grêmio (Round 14, 2026-05-02)

## Outcome: PREDICTIONS ABANDONED

Match was hard-deleted via admin panel; FK `predictions.match_id ON DELETE CASCADE` wiped all bets. Operator manually recreated the match (new UUID `4d612edc-8f59-4845-8b4a-347abb4f8b8d`, status `finished`, 0-0).

## Why no recovery

- Supabase project on **free tier** → **no PITR**.
- Postgres + API log retention does not cover the delete window (~2026-05-02 23:51-23:57 UTC).
- `points_history` orphans confirmed scoring ran before delete (6 winners × 2pts = 12pts, all `correct_result` on draw). Goal values per prediction not recoverable. Losing predictions (likely 1-2 more) untraceable.

## Decision

User decided: no partial recovery, no placeholder goal values. Move on. Implement soft-delete guard so this cannot recur.

## Affected users (informational only)

Lost 1 prediction each, all draw winners (2pts):

- Henrique (`4bc6ceac-6738-47a7-b58b-0517934626e1`)
- Saulo (`b9b6a052-529c-48fa-9695-d8ee354012ec`)
- Bebeto (`ba01101d-0bf9-41ad-babd-372f26efed6b`)
- Nicolas (`33defb01-0673-46ce-8e51-ffd69da2ad9e`)
- Sandro (`dbedde6f-ca63-441a-8c56-086511183425`)
- Alle (`9887da95-bf0a-4396-8bb5-cc451e5c17c1`)

`user_profiles.total_points` already includes the 12pts (credited at scoring time pre-delete) — no profile rollback needed.

`points_history` orphan rows (prediction_id=NULL, description="Match gremio-athletico finished") remain as historical record. Not deleted.

## Pre-existing counter drift (out of scope, flagged)

`user_profiles` counters disagree with row-counts in `predictions` for affected users (and likely others). Separate bug, predates this incident. Recommend a future audit task — do not fix as part of this work.

## Next step

Implement soft-delete guard for `matches` (Prompt 5):
- Add `matches.deleted_at` column.
- Admin delete → `UPDATE deleted_at` instead of `DELETE`.
- Confirm dialog when prediction count > 0.
- User-facing reads filter out soft-deleted matches.
