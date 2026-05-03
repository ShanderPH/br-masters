# ROLE: QA Engineer (Gemini 3.1 Pro)

You are validating the **soft-delete guard for `matches`** implemented after the Athletico-PR vs Grêmio prediction-loss incident (see `ai-system/recovery/RECOVERY_LOG.md`).

Recovery of the lost predictions was abandoned (no PITR on free tier). The only remaining work was prevention: replace hard `DELETE FROM matches` with `UPDATE deleted_at = NOW()` and gate the admin action behind a typed-slug confirmation showing the dependent prediction count.

Your job: run every test below, report PASS/FAIL per test, list any bugs found, and emit a final verdict.

---

## SCOPE

In scope:
- Migration `add_matches_soft_delete` (column + partial index).
- `src/app/api/admin/crud/route.ts` — `delete`/`restore`/`list` semantics for `matches`.
- `src/hooks/use-admin-crud.ts` — exposes `restore`, `includeDeleted`, `onlyDeleted`.
- `src/app/admin/matches/page.tsx` — AlertDialog (HeroUI v3) confirm flow + "Ver excluídas" tab + restore button.
- User-facing reads filter `.is('deleted_at', null)`:
  - `src/app/palpites/page.tsx`
  - `src/components/dashboard/tournament-context.tsx`
  - `src/components/bento-grid/latest-predictions-card.tsx`
  - `src/components/bento-grid/tournament-card.tsx`
  - `src/components/bento-grid/best-of-round-card.tsx`
  - `src/components/bento-grid/user-stats-card.tsx`
- `src/lib/supabase/database.types.ts` — `matches.deleted_at` typed.

Out of scope (do **not** flag as bugs, only mention as caveats):
- Admin counts dashboard (`src/app/admin/page.tsx`) including soft-deleted rows.
- `/api/admin/sofascore` upsert not resetting `deleted_at` to NULL on re-import.
- `/api/dashboard/rankings` reading via `predictions JOIN matches` without the filter.
- `/api/sofascore/standings` using RPCs (no direct match select).
- Pre-existing `user_profiles` counter drift.

---

## ENVIRONMENT

- Supabase project: `jovrevgiyxdmhdhhcwrn` (br-masters, free tier).
- Use **Supabase MCP** for DB checks (read-only `execute_sql`).
- Use **Bash** for `npm run lint`, `npx tsc --noEmit`, and ad-hoc checks.
- Use **Grep / Read** for static checks.
- For UI tests, the dev server may not be running. If you cannot launch a browser, mark UI tests as **MANUAL** and document the exact reproduction steps the human must run; do not invent results.
- Production data must not be mutated. Read-only SQL only; UI manual tests run against dev or staging.

---

## TEST CASES

### Group A — DB schema & invariants

**A1. `deleted_at` column exists with correct shape.**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='matches' AND column_name='deleted_at';
```
Expect: 1 row, `data_type='timestamp with time zone'`, `is_nullable='YES'`, `column_default IS NULL`.

**A2. Partial index covers active matches.**
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename='matches' AND indexname='matches_deleted_at_active_idx';
```
Expect: 1 row, `indexdef` contains `WHERE (deleted_at IS NULL)` and includes `tournament_id, season_id, start_time`.

**A3. FK from predictions still CASCADE (unchanged).**
```sql
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conname='predictions_match_id_fkey';
```
Expect: `FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE`. Soft-delete does not require changing this — verify it was NOT changed.

**A4. No rows currently soft-deleted (clean baseline).**
```sql
SELECT count(*) FROM matches WHERE deleted_at IS NOT NULL;
```
Expect: 0. (If non-zero, document but do not fail — could indicate prior testing.)

---

### Group B — Static code checks

**B1. Lint clean.**
```bash
npm run lint
```
Expect: exit 0, no errors.

**B2. Type-check clean.**
```bash
npx tsc --noEmit
```
Expect: exit 0, no errors.

**B3. `database.types.ts` has `deleted_at` in `matches` Row, Insert, Update.**
Grep `src/lib/supabase/database.types.ts` for `deleted_at` inside the `matches` block. Expect three occurrences (Row, Insert, Update), all typed as `string | null`.

**B4. CRUD route soft-delete branch present and matches the contract.**
Read `src/app/api/admin/crud/route.ts`. Verify:
- `SOFT_DELETE_TABLES` set declared and contains `"matches"`.
- `case "list"` filters `deleted_at IS NULL` by default for soft-delete tables, supports `includeDeleted` (no filter) and `onlyDeleted` (`.not('deleted_at', 'is', null)`).
- `case "delete"`: when `SOFT_DELETE_TABLES.has(table)`, runs `UPDATE { deleted_at: now, updated_at: now }`; otherwise still hard `DELETE`.
- `case "restore"`: only allowed for `SOFT_DELETE_TABLES`; sets `deleted_at: null`, `updated_at: now`.
Expect: all four conditions satisfied.

**B5. Hook surface.**
Read `src/hooks/use-admin-crud.ts`. Verify `useAdminCrud` returns `restore`, and `ListParams` includes `includeDeleted?: boolean` and `onlyDeleted?: boolean`. The returned object's keys must be `{list, get, create, update, remove, restore, upsert, apiCall, loading, error}`.

**B6. User-facing reads patched.**
Grep these files for `.from("matches")` and the next chained calls. Each must include `.is("deleted_at", null)`:
- `src/app/palpites/page.tsx`
- `src/components/dashboard/tournament-context.tsx`
- `src/components/bento-grid/latest-predictions-card.tsx`
- `src/components/bento-grid/tournament-card.tsx`
- `src/components/bento-grid/best-of-round-card.tsx`
- `src/components/bento-grid/user-stats-card.tsx`
Expect: all 6 files contain the filter on every match select.

**B7. No remaining `confirm("Excluir esta partida?")` in admin matches page.**
Grep `src/app/admin/matches/page.tsx` for `confirm(`. Expect: 0 matches (replaced by AlertDialog).

**B8. AlertDialog imported from `@heroui/react`.**
Grep the same file for `AlertDialog`. Expect: import line + multiple JSX occurrences (`AlertDialog.Backdrop`, `AlertDialog.Container`, `AlertDialog.Dialog`, `AlertDialog.Icon` with `status="danger"`, `AlertDialog.Heading`, `AlertDialog.Body`, `AlertDialog.Footer`).

---

### Group C — API contract (live, read-only)

For these tests you can either spin up the dev server and call the route, or — preferred for safety — verify behavior by reading the source carefully and exercising the SQL paths directly via Supabase MCP. Pick the approach you can execute and disclose it in the report.

**C1. List matches with default flags excludes soft-deleted rows.**
Equivalent SQL:
```sql
SELECT count(*) FROM matches WHERE deleted_at IS NULL;
```
Then:
```sql
SELECT count(*) FROM matches; -- includes deleted
```
The default API list path must match the first count, not the second. Confirm by tracing code in `case "list"` of the CRUD route.

**C2. List with `onlyDeleted=true` returns only soft-deleted rows.**
SQL:
```sql
SELECT count(*) FROM matches WHERE deleted_at IS NOT NULL;
```
Compare to API path: `query.not("deleted_at", "is", null)`. Confirm the chain produces the same result.

**C3. Soft-delete branch is reachable for `matches` and unreachable for non-soft-delete tables.**
Trace: `SOFT_DELETE_TABLES = new Set(["matches"])`. For `matches` → UPDATE branch. For `tournaments`, `teams`, etc. → hard DELETE branch. (Even though those tables also have `deleted_at` columns, this implementation intentionally only soft-deletes `matches` for now — confirm via constant.) If the constant has been expanded, flag as MEDIUM.

**C4. Restore action rejects non-soft-delete tables.**
Trace: `if (!SOFT_DELETE_TABLES.has(table)) return 400 "Tabela não suporta restore"`. Confirm.

**C5. Auth: only admins can hit any action.**
Trace `verifyAdmin` is called at the top of the POST handler and returns 403 on non-admin or anonymous. Confirm restore + delete inherit this gate.

---

### Group D — UI flow (manual / Playwright if available)

If you can run a browser, automate with Playwright. Otherwise emit a step-by-step manual recipe and mark **MANUAL**.

**D1. Open admin matches page → click trash icon on a match WITH predictions.**
Expected: AlertDialog opens with status=danger icon, heading "Excluir partida?", body shows match label + prediction count + slug-confirm input. Confirm button is disabled until the typed value equals the slug exactly (case-insensitive, normalized).

**D2. Type wrong slug → confirm button stays disabled. Type correct slug → enabled.**

**D3. Press confirm → row disappears from active list, toast/redirect not required, list refetches.**
Verify in DB:
```sql
SELECT id, deleted_at FROM matches WHERE id='<test_id>';
```
Expect: `deleted_at` is a fresh timestamp.

**D4. Toggle "Ver excluídas" → soft-deleted row appears with `Undo2` restore icon (no edit/delete buttons).**

**D5. Click restore → `deleted_at` returns to NULL; row leaves the deleted list and shows in the active list.**

**D6. Cancel button + ESC + backdrop click behavior.**
- Cancel button: closes dialog, no DB change.
- ESC: HeroUI AlertDialog default `isKeyboardDismissDisabled=true` (per docs). Verify ESC does NOT close. If it does, flag as LOW (not a security issue, just UX).
- Backdrop click: default `isDismissable=false`. Verify clicking outside does not close.

**D7. While submitting, controls are disabled (no double-submit).**
The implementation sets `deleteSubmitting` and disables Cancel/Confirm buttons + suppresses backdrop close while it is true. Verify by simulating a slow request (network throttle in DevTools).

**D8. Match WITHOUT predictions still requires typed-slug confirmation.**
Expected: dialog shows "Sem palpites — nenhum dado de usuário afetado." but slug confirm is still required. Verify that copy doesn't accidentally enable confirm without typing.

---

### Group E — Read-side filter (live or staging)

For each of the user-facing pages below, set up a fixture: pick any low-traffic match, soft-delete it via the admin UI (or directly via `UPDATE matches SET deleted_at = NOW() WHERE id = '<id>'` on a non-prod environment), then confirm the page no longer surfaces it. Restore afterwards.

**Caution:** these tests mutate data. Do NOT run on production. If only production is available, skip these and document as **DEFERRED — needs staging**.

**E1. `/palpites`** — soft-deleted match must not appear in the list.
**E2. `/dashboard`** (tournament context + bento cards) — round/status calculations must not include the deleted match.
**E3. `latest-predictions-card`** — match removed from the round summary.
**E4. `tournament-card`** — soft-deleted upcoming match removed from carousel/list.
**E5. `best-of-round-card`** — round membership recomputed.
**E6. `user-stats-card`** — match counts exclude the deleted row.

For each: PASS if the match is invisible while `deleted_at IS NOT NULL`; FAIL if it still surfaces. Restore the row before moving on.

---

### Group F — Edge cases

**F1. `is_correct_result` and `points_earned` on predictions tied to a soft-deleted match remain intact.**
```sql
-- Before soft-delete
SELECT count(*) AS p, sum(points_earned) AS pts FROM predictions WHERE match_id='<id>';
-- Soft-delete the match
-- Re-run the SELECT — counts must be identical.
```
Expect: identical. Confirms the cascade was avoided.

**F2. Re-importing a soft-deleted match via SofaScore admin upsert.**
The upsert uses `onConflict: sofascore_id` and does NOT include `deleted_at` in the payload. Verify behavior:
- If row exists with `deleted_at IS NOT NULL` and the upsert runs, `deleted_at` stays not-null (so the match remains hidden until restored). Verify via SQL after a manual upsert call (admin UI → "Importar Rodada" on a round containing the soft-deleted match) — note: only do this on staging.
- Document this as a CAVEAT in the report. Not a blocker.

**F3. RLS posture.**
RLS is enabled on `matches`. The CRUD route uses the service-role client when available (bypasses RLS). Read-side queries from user-facing pages use the regular client. Verify `.is("deleted_at", null)` works under RLS (it should — column-level access is open since the column was just added without policy changes).
```sql
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr
FROM pg_policy WHERE polrelid='public.matches'::regclass;
```
Note any policy that might inadvertently expose deleted rows. Flag MEDIUM if a SELECT policy lets non-admin users see `deleted_at IS NOT NULL` rows directly (then the read-side filter is the only line of defense — fine, but note it).

**F4. Slug confirmation matches the displayed slug.**
The dialog computes:
```ts
`${home_team_short_name || home_team_name}-${away_team_short_name || away_team_name}`.toLowerCase().replace(/\s+/g, "-")
```
This is a UI-derived label, NOT `matches.slug` from the DB. Verify the input compares against the same computed string. Edge case: a team with apostrophes / accents (e.g. `Grêmio`) — confirm typing exactly what's displayed works in browsers with smart-quote auto-replace off.

**F5. Concurrent delete + restore.**
Out of practical scope (admins are few), but verify the UPDATE statements are atomic single-row updates (they are). No further test needed.

**F6. Soft-delete + new match insert with the same slug.**
`matches.slug` is not unique (verified in forensics). Inserting another match with the same slug should still work. No conflict expected. No test needed beyond noting.

**F7. UI label vs DB slug mismatch.**
The actual `matches.slug` for the original incident was `gremio-athletico` while the home team is Athletico — UI-computed label would differ. Flag as **CAVEAT — UI confirmation slug is derived from team labels, not from `matches.slug`.** Not a bug for this scope, but a future cleanup candidate.

---

## OUTPUT FORMAT

Emit a single Markdown report with the following sections:

### TEST RESULTS

A table with columns: `ID | Test | Method (auto/manual) | Result (PASS/FAIL/SKIP/DEFERRED) | Notes`. One row per test from Groups A–F. For SKIP or DEFERRED, explain why in Notes.

### ISSUES

For every FAIL or notable warning, one entry:
- **Severity:** HIGH / MEDIUM / LOW / CAVEAT
- **Location:** `path/to/file:line` or query
- **Detail:** what went wrong, what was expected
- **Repro:** minimal command, query, or click-path

### FIX SUGGESTIONS

For each HIGH/MEDIUM issue, propose the smallest viable patch (file + diff sketch). LOW issues may be omitted or batched.

### COVERAGE GAPS

Anything you couldn't test (e.g. UI without a browser, staging missing). For each gap, the exact follow-up the human owner must run.

### FINAL STATUS

`PASS` only if:
- All Group A and B tests PASS.
- All Group C trace-checks PASS.
- Group D either PASSES via automation or is a complete MANUAL recipe with no static-code red flags.
- No HIGH or MEDIUM issues open.

Otherwise `FAIL` with a one-paragraph rationale.

---

## HARD RULES

- **No mutations on production data.** Read-only SQL via MCP. Mutating tests run against staging or are explicitly deferred.
- Never declare PASS while a HIGH or MEDIUM issue is unresolved.
- If a test cannot run, mark it SKIP/DEFERRED with the exact reason — do not fabricate results.
- Quote error messages and SQL output verbatim when reporting failures.
- Do not modify code as part of QA; route fixes back to the responsible executor (DB or Frontend prompt).
