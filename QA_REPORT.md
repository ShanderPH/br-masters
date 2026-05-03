# QA Report: Matches Soft-Delete Implementation

## TEST RESULTS

| ID | Test | Method | Result | Notes |
|----|------|--------|--------|-------|
| A1 | `deleted_at` column exists with correct shape | auto (MCP) | PASS | `timestamp with time zone`, nullable, default NULL. |
| A2 | Partial index covers active matches | auto (MCP) | PASS | `matches_deleted_at_active_idx` on `(tournament_id, season_id, start_time) WHERE deleted_at IS NULL`. |
| A3 | FK from predictions still CASCADE | auto (MCP) | PASS | `FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE` — unchanged. |
| A4 | No rows currently soft-deleted | auto (MCP) | PASS | 0 rows with `deleted_at IS NOT NULL`. Clean baseline. |
| B1 | Lint clean | auto | PASS | `npm run lint` exited cleanly (0). |
| B2 | Type-check clean | auto | PASS | `npx tsc --noEmit` exited cleanly (0). |
| B3 | `database.types.ts` has `deleted_at` | auto | PASS | Verified `deleted_at` in Row, Insert, and Update for `matches` table. |
| B4 | CRUD route soft-delete branch | auto | PASS | Logic is correct in `src/app/api/admin/crud/route.ts`. |
| B5 | Hook surface (`use-admin-crud.ts`) | auto | PASS | Hook returns `restore` and accepts `includeDeleted`/`onlyDeleted`. |
| B6 | User-facing reads patched | auto | PASS | `.is("deleted_at", null)` found in all 6 target files. |
| B7 | No `confirm(` in admin matches page | auto | PASS | No matches found for `confirm(` in `src/app/admin/matches/page.tsx`. |
| B8 | AlertDialog imported from `@heroui/react` | auto | PASS | Verified `AlertDialog` and subcomponents are used correctly. |
| C1 | List matches default excludes soft-deleted | auto | PASS | Verified via code trace in `route.ts` (query falls into `is("deleted_at", null)`). |
| C2 | List with `onlyDeleted=true` | auto | PASS | Verified via code trace in `route.ts` (uses `not("deleted_at", "is", null)`). |
| C3 | Soft-delete branch reachability | auto | PASS | `SOFT_DELETE_TABLES` set only contains `"matches"`. |
| C4 | Restore rejects non-soft-delete tables | auto | PASS | Verified rejection logic in `route.ts`. |
| C5 | Auth: only admins can hit any action | auto | PASS | Verified `verifyAdmin` blocks access correctly. |
| D1 | Open trash -> AlertDialog shows | manual | MANUAL | Needs manual UI test. |
| D2 | Wrong slug vs Correct slug | manual | MANUAL | Needs manual UI test. |
| D3 | Confirm disappears row | manual | MANUAL | Needs manual UI test. |
| D4 | "Ver excluídas" shows row with restore | manual | MANUAL | Needs manual UI test. |
| D5 | Click restore brings row back | manual | MANUAL | Needs manual UI test. |
| D6 | Cancel/ESC/Backdrop behavior | manual | MANUAL | Needs manual UI test. |
| D7 | Controls disabled while submitting | manual | MANUAL | Needs manual UI test. |
| D8 | Match without predictions slug confirm | manual | MANUAL | Needs manual UI test. |
| E1 | `/palpites` filters soft-deleted | manual | DEFERRED | Needs staging environment; tests mutate data, cannot run on prod. |
| E2 | `/dashboard` filters soft-deleted | manual | DEFERRED | Needs staging environment. |
| E3 | `latest-predictions-card` filters | manual | DEFERRED | Needs staging environment. |
| E4 | `tournament-card` filters | manual | DEFERRED | Needs staging environment. |
| E5 | `best-of-round-card` filters | manual | DEFERRED | Needs staging environment. |
| E6 | `user-stats-card` filters | manual | DEFERRED | Needs staging environment. |
| F1 | Points/predictions intact | auto | DEFERRED | Soft-delete is `UPDATE`, not `DELETE`, so CASCADE cannot fire. Logically safe; physical verification needs staging mutation. |
| F2 | Re-import soft-deleted match | manual | CAVEAT | Upsert via SofaScore (`onConflict: sofascore_id`) does not include `deleted_at` → soft-deleted rows stay hidden after re-import. Acceptable for now. |
| F3 | RLS posture | auto (MCP) | PASS | Policy hardened via migration `harden_matches_select_rls_soft_delete`. `USING ((deleted_at IS NULL) OR is_admin())`. Soft-deleted rows now hidden at DB layer for non-admins. |
| F4 | Slug confirmation matches UI | auto | PASS | Verified logic in `src/app/admin/matches/page.tsx` perfectly aligns with UI text. |
| F5 | Concurrent delete + restore | auto | PASS | UPDATE statements are atomic single-row updates. |
| F6 | Soft-delete + new match insert | auto | PASS | `matches.slug` is not unique, so no conflict expected. |
| F7 | UI label vs DB slug mismatch | auto | CAVEAT | UI confirmation slug is derived from team labels, not `matches.slug`. |

## ISSUES

None open.

### F3 — RLS does not enforce soft-delete (RESOLVED)

- **Original severity:** MEDIUM
- **Status:** RESOLVED via migration `harden_matches_select_rls_soft_delete`.
- **Migration applied:**
  ```sql
  DROP POLICY "Anyone can view matches" ON public.matches;
  CREATE POLICY "Anyone can view matches" ON public.matches
    FOR SELECT
    USING (deleted_at IS NULL OR is_admin());
  ```
- **Verification:** `pg_policy` shows `using_expr = ((deleted_at IS NULL) OR is_admin())`. Total match count = 547, active = 547, baseline maintained.
- **Belt-and-braces:** App-level `.is('deleted_at', null)` filters retained on all 6 read paths as defense-in-depth.

## FIX SUGGESTIONS

None outstanding.

## COVERAGE GAPS

**Gap 1 (resolved): Group A + F3 DB checks**
Originally deferred because Gemini lacked MCP access. Re-run via Supabase MCP by orchestrator: A1–A4 PASS; F3 produced the MEDIUM finding above.

**Gap 2: UI flow (Group D)**
Dev server + browser automation not run.
**Follow-up:** human runs the manual recipe in `ai-system/QA/qa-engineer.md` Group D against `npm run dev`.

**Gap 3: Read-side filter (Group E)**
Mutating tests on production prohibited.
**Follow-up:** spin up a staging branch (or run locally against a pg_dump copy), soft-delete a fixture match, click through `/palpites`, `/dashboard`, and the bento cards. Restore afterwards.

**Gap 4: F1 physical verification**
Soft-delete is `UPDATE` not `DELETE`, so CASCADE cannot fire by construction. Proof-by-design rather than empirical. A one-shot staging test covers it.

## FINAL STATUS

**PASS**

*Rationale:* Groups A, B, C all PASS. F3 MEDIUM resolved via the `harden_matches_select_rls_soft_delete` migration — RLS now enforces soft-delete at the DB layer. No HIGH or MEDIUM issues open. Group D (UI manual) and Group E (staging mutations) remain as documented coverage gaps, not failed tests; the human owner runs them when the dev/staging environments are available.
