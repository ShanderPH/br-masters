# PROMPT 2 — DB Executor: PITR Branch + Dump

**Model:** Claude Opus 4.7
**Phase:** Irreversible — branch creation (billable). User pre-approved.
**Reads:** `ai-system/prompts/00-context.md`, `ai-system/recovery/forensics.json`

## Goal

Materialize a PITR branch just before the delete and extract the lost predictions verbatim.

## Preconditions

- `forensics.json.go_no_go == "GO"`
- `forensics.json.pitr_covers_delete == true`
- `forensics.json.delete_timestamp_utc` set

## Steps (Supabase MCP)

1. `create_branch`:
   - name: `recovery-match-2026-05-02`
   - confirm_cost first (`get_cost` + `confirm_cost`)
   - restore point: `T_DEL - 5 minutes` (use forensics value)
2. On the branch, `execute_sql`:
   ```sql
   -- Identify deleted match by team pair + date (UUID was different from restored row)
   SELECT * FROM matches
   WHERE start_time::date = '2026-05-02'
     AND tournament_id = '<tournament_uuid>'
     AND season_id = '<season_uuid>'
     AND home_team_id IN ('<atl>', '<gre>')
     AND away_team_id IN ('<atl>', '<gre>')
   LIMIT 5;
   -- Expect exactly 1 row. Capture as deleted_match.

   SELECT * FROM predictions WHERE match_id = '<deleted_match_uuid>';
   ```
3. Save the result to `ai-system/recovery/match-2026-05-02.json`:
   ```json
   {
     "deleted_match": { "id": "...", "home_team_id": "...", "away_team_id": "...", "start_time": "...", "status": "...", "home_score": 0, "away_score": 0, "...": "..." },
     "predictions": [
       { "id": "...", "user_id": "...", "match_id": "<deleted_match_uuid>", "home_team_goals": 1, "away_team_goals": 0, "winner": "home", "created_at": "...", "updated_at": "..." }
     ],
     "extracted_at": "ISO timestamp",
     "branch": "recovery-match-2026-05-02",
     "branch_pit": "T_DEL - 5min ISO"
   }
   ```
4. **Do not merge the branch.** Do not modify branch data. Do not delete the branch yet — keep until QA passes (Prompt 6).

## Output

- File `ai-system/recovery/match-2026-05-02.json`
- In your reply: prediction row count, deleted match UUID, deleted match home/away score (for sanity vs restored row), branch URL.

## Hard rules

- Branch is read-only from your perspective.
- If branch creation fails or cost confirmation rejected, abort and report — do not retry destructively.
- Do not log PII (user IDs are fine, no email/phone in the dump unless schema demands).
