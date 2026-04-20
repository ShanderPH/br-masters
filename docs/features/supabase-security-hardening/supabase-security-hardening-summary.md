# Supabase Security Hardening - Summary

**Date:** 2025-03-20  
**Supabase Project ID:** jovrevgiyxdmhdhhcwrn  
**Status:** ✅ Completed

## Overview

Complete security audit and remediation of the BR Masters Supabase database, resolving all 20 errors and 39 of 40 warnings reported by the Supabase Security Advisor.

## Before

| Level   | Count | Description                              |
|---------|-------|------------------------------------------|
| ERROR   | 12    | SECURITY DEFINER views                   |
| ERROR   | 8     | Tables without RLS enabled               |
| WARNING | 27+13 | Functions with mutable search_path       |
| WARNING | 1     | Leaked password protection disabled      |

**Total: 20 errors + 40 warnings = 60 issues**

## After

| Level   | Count | Description                              |
|---------|-------|------------------------------------------|
| ERROR   | 0     | None                                     |
| WARNING | 1     | Leaked password protection (Auth config) |

**Total: 0 errors + 1 warning = 1 issue (manual dashboard config)**

---

## Migrations Applied

### 1. `enable_rls_on_unprotected_tables`

Enabled Row Level Security (RLS) on 8 public tables that were exposed without protection:

| Table                    | Rows | RLS Policies Applied                          |
|--------------------------|------|-----------------------------------------------|
| `managers`               | 0    | SELECT: anyone, ALL: admin + service_role      |
| `players`                | 0    | SELECT: anyone, ALL: admin + service_role      |
| `audit_logs`             | 0    | SELECT: admin only, ALL: service_role          |
| `legacy_matches`         | 0    | SELECT: admin only, ALL: service_role          |
| `legacy_users_profiles`  | 0    | SELECT: admin only, ALL: service_role          |
| `legacy_predictions`     | 0    | SELECT: admin only, ALL: service_role          |
| `legacy_id_mapping`      | 0    | SELECT: admin only, ALL: service_role          |
| `standings_cache`        | 1    | SELECT: anyone, ALL: admin + service_role      |

**Rationale:**
- Public-facing tables (`managers`, `players`, `standings_cache`) allow read access
- Legacy/migration tables locked to admin-only (no app usage, data archived)
- `audit_logs` restricted to admin for security sensitivity

### 2. `fix_security_definer_views`

Converted 12 views from `SECURITY DEFINER` to `SECURITY INVOKER`:

| View                          | Used By                       |
|-------------------------------|-------------------------------|
| `recent_results`              | latest-matches-card, partidas |
| `global_ranking`              | best-of-round-card, partidas  |
| `user_stats`                  | profile pages                 |
| `prize_pool_summary`          | dashboard                     |
| `system_statistics`           | admin dashboard                |
| `user_predictions_detailed`   | prediction history            |
| `tournament_standings`        | standings page                |
| `active_tournaments`          | tournament context            |
| `sofascore_sync_status`       | admin sync status             |
| `league_ranking`              | league pages                  |
| `upcoming_matches`            | next-matches-card, partidas   |
| `match_prediction_distribution` | match detail               |

**Rationale:**
- `SECURITY DEFINER` views bypass RLS, running queries as the view creator (superuser)
- `SECURITY INVOKER` respects the querying user's RLS policies
- All underlying tables already have appropriate `SELECT` policies for `public` role
- Explicit `GRANT SELECT` to `anon` and `authenticated` roles ensures functionality

### 3. `fix_function_search_path_part1` + `fix_function_search_path_part2` + `fix_function_search_path_part3`

Fixed `search_path` on all 40 public functions:

**SECURITY DEFINER functions (empty search_path + fully qualified refs):**
- `is_admin()` — Critical RLS helper, `SET search_path = ''`
- `update_prize_pool_on_deposit()` — Trigger, `SET search_path = ''`

**Regular functions (search_path = 'public'):**
All other 38 functions including triggers, helpers, migration functions, and RPC functions.

**Rationale:**
- Mutable search_path allows search path injection attacks
- `SECURITY DEFINER` functions with mutable paths are especially dangerous (can be exploited to escalate privileges)
- Setting `search_path = ''` for SECURITY DEFINER forces fully qualified table names, preventing manipulation
- Setting `search_path = 'public'` for regular functions prevents accidental resolution to malicious schemas

---

## Remaining Warning

### Leaked Password Protection (Auth Config)

The only remaining warning is `auth_leaked_password_protection` — this must be enabled manually in the Supabase Dashboard:

1. Go to **Authentication** → **Settings** → **Security**
2. Enable **"Leaked password protection"**
3. This checks passwords against HaveIBeenPwned.org

This cannot be configured via SQL migration.

---

## Impact on Application

**No breaking changes.** All fixes were designed to preserve existing functionality:

- Views maintain identical column definitions and query logic
- RLS policies on new tables match existing patterns (public read, admin write, service_role full)
- Function signatures preserved (drop+recreate only when parameter names conflicted)
- All triggers remain attached and functional
- `GRANT SELECT` on views ensures `anon` and `authenticated` roles can still query them
