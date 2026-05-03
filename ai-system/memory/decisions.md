# Decisions

- Decision: Defer DB Schema SQL verification (Group A) and Mark QA Report as FAIL.
- Context: `qa-engineer.md` mandated `execute_sql` via Supabase MCP to test soft-delete, but Supabase MCP was unavailable in Gemini's local environment and production should not be mutated.
- Alternatives considered: Bypassing the check entirely and falsely passing the test. Running tests via REST API or local psql.
- Reason: Strict hard rules ("If a test cannot run, mark it SKIP/DEFERRED with the exact reason — do not fabricate results", "Never declare PASS while a HIGH or MEDIUM issue is unresolved").

- Decision: Output QA Report directly to the repository root as `QA_REPORT.md`.
- Context: Single Markdown report requested; saving locally enables direct review.
- Alternatives considered: Outputting to the `artifacts` AppData directory.
- Reason: Discoverability and version control.

- Decision (orchestrator follow-up): Re-run deferred Group A + F3 via Supabase MCP since the orchestrator has MCP access.
- Context: The deferral was environment-specific (Gemini side); orchestrator could close the gap without touching prod data (read-only SQL).
- Reason: Reduce open coverage gaps; convert deferred → PASS where possible.

- Decision: Keep FAIL status open pending one MEDIUM finding (F3 RLS).
- Context: F3 revealed `USING (true)` on the `matches` SELECT policy, leaving DB-level visibility of soft-deleted rows.
- Alternatives considered: Downgrade to CAVEAT and PASS; apply the one-line policy migration immediately.
- Reason: Per QA rule "no PASS while MEDIUM open." Recommended fix is a one-line migration documented in QA_REPORT.md FIX SUGGESTIONS — owner decides whether to apply or downgrade.

- Decision: Apply F3 fix migration `harden_matches_select_rls_soft_delete`.
- Context: Owner approved the one-line policy fix.
- Migration: `DROP POLICY "Anyone can view matches"` then `CREATE POLICY ... USING (deleted_at IS NULL OR is_admin())`.
- Verification: `pg_policy` shows new expression; 547 active matches still visible.
- Reason: Adds DB-level enforcement of soft-delete invariant; converts F3 → PASS; flips final QA status to PASS.
