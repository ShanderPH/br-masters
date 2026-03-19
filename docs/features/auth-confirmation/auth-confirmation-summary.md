# Auth Confirmation Redirect Flow

## Date
2026-03-19

## Context
The signup flow was creating users but did not have a complete Supabase email confirmation redirect handling route in the app. To align with Supabase SSR/PKCE recommendations, we implemented a dedicated callback route and a confirmation result page.

## What Was Implemented

### 1) Signup redirect configuration
File: `src/app/register/page.tsx`

- Added `emailRedirectTo` to `supabase.auth.signUp()`:
  - Redirect target: `/auth/confirm?next=/cadastro-confirmado`
- Updated success state message to guide users to confirm their email.
- Removed automatic delayed redirect to login after signup.
- Added explicit CTA button for login in the post-signup state.

### 2) Supabase auth confirmation callback route
File: `src/app/auth/confirm/route.ts`

- Created callback route to process email confirmation links.
- Supports both confirmation styles:
  - `verifyOtp({ token_hash, type })`
  - `exchangeCodeForSession(code)` fallback
- Added safe redirect handling for `next` param (blocks open redirect by only allowing same-origin relative paths).
- Redirect behavior:
  - Success: `next?confirmed=1`
  - Failure: `/cadastro-confirmado?confirmed=0`

### 3) Confirmation result page
File: `src/app/cadastro-confirmado/page.tsx`

- Created a new confirmation status page with project visual language:
  - BR Masters logo
  - geometric/EA FC-inspired visual structure
  - no rounded corners in actionable controls
  - existing scalable components (`@heroui/react` Button + shared `BRMLogo`)
- Reads `confirmed` query param and renders:
  - success state (`confirmed=1`)
  - failure state (`confirmed=0`)
- Includes CTA buttons:
  - `Fazer Login`
  - `Voltar ao Cadastro`

### 4) Route access in proxy
File: `src/proxy.ts`

- Added public routes so unauthenticated users can complete confirmation flow:
  - `/auth/confirm`
  - `/cadastro-confirmado`

### 5) Route constants
File: `src/lib/routes.ts`

- Confirmed/added:
  - `ROUTES.AUTH_CONFIRM = "/auth/confirm"`
  - `ROUTES.REGISTER_CONFIRMED = "/cadastro-confirmado"`

## Validation

### Build and Type Safety
- `npx tsc --noEmit --skipLibCheck` ✅
- `npm run build` ✅

### Runtime Validation (Playwright)
- `/cadastro-confirmado?confirmed=1` renders success state ✅
- `/auth/confirm?next=%2Fcadastro-confirmado` redirects to `/cadastro-confirmado?confirmed=0` when token is absent/invalid ✅

## Notes for Supabase Dashboard
For production, ensure **Auth > URL Configuration** includes:
- Site URL (production domain)
- Additional Redirect URLs including:
  - `https://<your-domain>/auth/confirm`
  - `http://localhost:3000/auth/confirm` (dev)

If using custom email templates with PKCE flow, template links should include `token_hash`, `type`, and `next` as recommended by Supabase docs.
