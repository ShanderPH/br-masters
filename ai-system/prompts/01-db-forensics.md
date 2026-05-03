# PROMPT 1 — DB Executor: Forensics

**Model:** Claude Opus 4.7
**Phase:** Read-only investigation
**Reads:** `ai-system/prompts/00-context.md`

## Goal

Locate everything needed for recovery. **Mutate nothing.**

## Inputs

- Tournament external ID: `325` (Brazilian Serie A 2026)
- Season external ID: `87678`
- Round: `14`
- Match date: `2026-05-02`
- Teams: Atlético Paranaense, Grêmio

## Steps (Supabase MCP)

1. `list_tables` → confirm schemas of `matches`, `predictions`, `user_profiles`, `user_tournament_points`, `tournaments`, `tournament_seasons`, `teams`. Capture FK delete rule for `predictions.match_id` (CASCADE / RESTRICT / SET NULL).
2. `execute_sql` (read-only):
   ```sql
   -- tournament + season UUIDs
   SELECT t.id AS tournament_id, ts.id AS season_id
   FROM tournaments t
   JOIN tournament_seasons ts ON ts.tournament_id = t.id
   WHERE (t.external_id = 325 OR t.name ILIKE '%Brasileir%Série A%')
     AND (ts.external_id = 87678 OR ts.year = 2026);

   -- team UUIDs
   SELECT id, name FROM teams
   WHERE name ILIKE '%paranaense%' OR name ILIKE '%athletico%' OR name ILIKE '%atlético-pr%'
      OR name ILIKE '%grêmio%' OR name ILIKE '%gremio%';

   -- restored match (current state)
   SELECT * FROM matches
   WHERE start_time::date = '2026-05-02'
     AND tournament_id = '<tournament_uuid>'
     AND season_id = '<season_uuid>'
     AND ((home_team_id IN (<atletico>, <gremio>)) AND (away_team_id IN (<atletico>, <gremio>)));

   -- predictions currently pointing to restored match (should be 0)
   SELECT count(*) FROM predictions WHERE match_id = '<restored_match_uuid>';

   -- unique constraint check
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'predictions'::regclass AND contype IN ('u','p');
   ```
3. `get_logs` → fetch postgres / api logs covering last 14 days, grep for `DELETE FROM matches` or `DELETE FROM "matches"`. Record approximate delete timestamp `T_DEL`.
4. `list_branches` → confirm no stale `recovery-*` branch.
5. `get_project` → confirm PITR enabled + retention window covers `T_DEL`.

## Output (write to `ai-system/recovery/forensics.json`)

```json
{
  "tournament_uuid": "...",
  "season_uuid": "...",
  "team_atletico_pr_uuid": "...",
  "team_gremio_uuid": "...",
  "restored_match_uuid": "...",
  "restored_match_home_id": "...",
  "restored_match_away_id": "...",
  "restored_match_home_score": 0,
  "restored_match_away_score": 0,
  "restored_match_status": "finished",
  "restored_match_start_time": "...",
  "predictions_match_id_fk_on_delete": "CASCADE | RESTRICT | NO ACTION | SET NULL",
  "predictions_unique_constraint": "predictions_user_id_match_id_key | none",
  "delete_timestamp_utc": "2026-05-0X T HH:MM:SSZ",
  "delete_log_evidence": "raw log line or query trace",
  "pitr_enabled": true,
  "pitr_retention_days": 7,
  "pitr_covers_delete": true,
  "go_no_go": "GO" 
}
```

Also report any anomalies (multiple matches matching, missing externals, etc.) at the top of your reply.

## Hard rules

- **Read-only.** No INSERT/UPDATE/DELETE/DDL.
- Do not query bulk prediction data; restrict to counts + the affected match.
- Do not export user PII outside the recovery folder.
