# Current Auth Flow Snapshot

## Source of truth today
- Frontend uses Supabase Auth directly from the Next.js app.
- Existing login logic lives in `src/lib/auth/auth-service.ts`.
- Existing state wrapper lives in `src/hooks/use-auth.ts`.
- Login page lives in `src/app/login/page.tsx`.
- Login UI component lives in `src/components/auth/login-screen.tsx`.

## Current behaviors
- Username/ID login is supported.
- Email login is supported.
- Username login works by resolving `firebase_id` from `public.users`, then reading the matching email from `public.user_profiles`, and finally calling `supabase.auth.signInWithPassword`.
- Session persistence and auth state change handling are currently managed by the browser Supabase client.
- User data is assembled from `public.users` + `public.user_profiles` into an `AppUser` object.

## Relevant data shape already used by the frontend
- `users.id`
- `users.username`
- `users.firebase_id`
- `users.favorite_team_id`
- `users.role`
- `user_profiles.id`
- `user_profiles.first_name`
- `user_profiles.last_name`
- `user_profiles.email`
- `user_profiles.avatar_url`

## Migration constraint
The public interface consumed by the login page should remain stable where possible:
- `useAuth().login`
- `useAuth().loginWithEmail`
- `useAuth().logout`
- `useAuth().refreshUser`
- `isAuthenticated`
- `isAdmin`

## Incremental migration goal
Move credential verification to the new Django backend without forcing a full UI rewrite.
