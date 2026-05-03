# Recovery Context — Atlético-PR vs Grêmio (2026-05-02)

Shared context for all execution prompts in this folder. Read first.

## Incident

- Match **Atlético Paranaense vs Grêmio** played on **2026-05-02**, Brazilian Serie A 2026, round 14.
- External tournament ID: `325`. External season ID: `87678`.
- Match was **hard-deleted** via admin panel.
- FK `predictions.match_id → matches.id` cascaded → predictions rows lost in prod.
- Operator manually re-inserted the match row (status=`finished`, real final score). The new row has a **new UUID**, different from the deleted one.

## Recovery state

| Item | State |
|------|-------|
| Match row | Restored manually (new UUID, status `finished`, with home/away scores) |
| Predictions | LOST in prod, recoverable from PITR |
| user_profiles counters | Stale (predictions_count drifted; correct/exact counters never scored these) |
| user_tournament_points | Stale (points never awarded) |
| PITR | Available, approved for branch creation |

## Plan

1. Forensics → confirm FK rule, locate delete timestamp, capture current restored match UUID, capture team UUIDs.
2. PITR branch at `T - 5min` → dump deleted match + predictions JSON to `ai-system/recovery/match-2026-05-02.json`.
3. Re-insert predictions in prod, **rebound to the new (restored) match_id**.
4. Score recovered predictions against the final result + recompute `user_profiles` and `user_tournament_points`.
5. Soft-delete guard in admin UI to prevent recurrence.
6. QA gate.

## Scoring rules (from `xp-service.ts` / `scoring-config.ts`)

- Exact score: 5 pts
- Correct winner / draw: 2 pts
- Miss: 0 pts

## Constraints (apply to every prompt)

- **Do not modify other matches** or unrelated predictions.
- Idempotent migrations (`ON CONFLICT DO NOTHING` / guards).
- Single transaction per migration.
- Read-only steps stay read-only.
- Use Supabase MCP for DB ops.
- No new dependencies unless required.

## File outputs convention

- Recovery dump: `ai-system/recovery/match-2026-05-02.json`
- Migrations: `supabase/migrations/<timestamp>_<name>.sql` (or whatever convention `apply_migration` uses)
- Pre/post checksums: `ai-system/recovery/checksums-pre.json`, `checksums-post.json`
