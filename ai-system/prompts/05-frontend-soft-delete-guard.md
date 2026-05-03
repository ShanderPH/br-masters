# PROMPT 5 — Frontend Executor: Soft-Delete Guard

**Model:** Claude Sonnet 4.6
**Phase:** Code change. Prevent recurrence. Independent of recovery (can run in parallel with Prompts 3/4 if needed).
**Reads:** `00-context.md`, project `CLAUDE.md`, `.heroui-docs/react/components/(overlays)/alert-dialog.mdx`

## Goal

Make admin match deletion safe:
1. Soft delete (`deleted_at`), not hard delete.
2. Confirm dialog showing prediction count when count > 0; require typing match slug to proceed.
3. User-facing reads exclude soft-deleted rows.
4. Add restore action for soft-deleted matches in admin.

## DB migration (`add_matches_soft_delete`)

```sql
ALTER TABLE matches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS matches_deleted_at_idx ON matches (deleted_at) WHERE deleted_at IS NULL;

-- Update RLS to filter by default for non-admin reads if RLS enforces it.
-- Inspect existing policies first; do not weaken them.
```

Update `src/lib/supabase/database.types.ts`: add `deleted_at: string | null` to `matches.Row/Insert/Update`.

## Code changes

### 1. Locate admin match delete

Grep for the admin matches CRUD entry points. Likely in `src/app/admin/...` or via `useAdminCrud` (`src/hooks/use-admin-crud.ts`). Use `Grep` for `from('matches').delete` and `useAdminCrud`. Inspect both before changing.

### 2. Replace hard delete

```ts
// before
await supabase.from('matches').delete().eq('id', matchId);

// after
const { count } = await supabase
  .from('predictions')
  .select('id', { count: 'exact', head: true })
  .eq('match_id', matchId);

if ((count ?? 0) > 0) {
  // open AlertDialog (HeroUI v3) — typed-confirmation flow (see component below)
  // proceed only if user types the match slug exactly
}

await supabase
  .from('matches')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', matchId);
```

### 3. AlertDialog component (HeroUI v3)

Use `Alert.Dialog` per `.heroui-docs/react/components/(overlays)/alert-dialog.mdx`. Status `danger`. Body must:
- show prediction count
- show match label (`{home} x {away} — round {n}`)
- input field requiring the match slug typed exactly
- cancel + confirm buttons; confirm disabled until typed value matches slug

### 4. Restore action

Admin matches list:
- Show soft-deleted rows in a separate filter/tab (e.g. "Excluídas").
- Action `Restaurar`: `update({ deleted_at: null })`.

### 5. Read-side filter

Patch every user-facing read of `matches` to add `.is('deleted_at', null)`:

```ts
supabase.from('matches').select(...).is('deleted_at', null)
```

Search paths to patch (not exhaustive — grep them all):
- `src/app/api/sofascore/standings/route.ts` (if it joins matches)
- `src/lib/services/*.ts`
- pages: `partidas`, `dashboard`, `palpites`, `ranking`, `classificacao`
- any view/RPC that selects from `matches` (check `should_refresh_standings`, `get_cached_standings` server-side too — flag if they read matches)

Admin pages may keep showing all (with deleted indicator).

### 6. Lint + types

`npm run lint` must pass. `tsc --noEmit` clean.

## Output

- Migration file
- List of changed files w/ short description
- Lint output (PASS)
- Note any DB views / RPCs touching `matches` that still need a deleted_at filter at SQL layer

## Hard rules

- Do NOT change scoring, prediction submission, or auth flow.
- HeroUI v3 only — read the local docs in `.heroui-docs/`. No v2 imports.
- No new dependencies.
- Do NOT modify `src/proxy.ts` route protection.
