# Context

- Validated soft-delete implementation for `matches` table following the Athletico-PR vs Grêmio prediction-loss incident.
- Group A (DB invariants) and F3 (RLS) re-run by orchestrator via Supabase MCP after Gemini's initial deferral.
- Group A: PASS (column shape, partial index, FK CASCADE intact, 0 soft-deleted rows baseline).
- F3: RESOLVED via migration `harden_matches_select_rls_soft_delete` — `USING ((deleted_at IS NULL) OR is_admin())`. App-layer `.is('deleted_at', null)` retained as defense-in-depth.
- Final QA status: PASS.
- Group D (UI) and Group E (staging mutations) still outstanding — coverage gaps for the human to run when dev/staging is available.
