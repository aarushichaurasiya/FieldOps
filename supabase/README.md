# FieldOps Supabase

Stage 1 uses Supabase project `vezjdmgatlhxktbrsvwm`.

## Live database

- Region: `ap-northeast-1`
- PostgreSQL: 17
- Stage 1 migration: `20261001053004_stage_1_core_schema_auth_rls`
- Stage 1 index migration: `20261001053100_stage_1_fk_indexes`

The live project is the verified source of the current database state. Before local database work, pull the remote migration/schema with the Supabase CLI and keep the resulting SQL under `supabase/migrations/`.

## Stage 1 guarantees

- 15 application tables are present.
- RLS is enabled on all 15 application tables.
- 30 RLS policies are installed.
- Auth user creation creates a matching public profile.
- Organization memberships carry the application role.
- Cross-organization relationships use composite foreign keys where required.
- A job can have only one active technician assignment.
- Client grants are intentionally limited; workflow write policies are added with the corresponding business stage.
- Private authorization helpers live in the non-exposed `private` schema.
- No service-role/secret key belongs in browser code.

## Authentication

The Next.js application uses `@supabase/ssr` with:

- browser client: `lib/supabase/client.ts`
- server client: `lib/supabase/server.ts`
- session refresh: `lib/supabase/proxy.ts` + root `proxy.ts`
- sign-in/sign-up: `app/auth/login/page.tsx`
- email confirmation: `app/auth/callback/route.ts`
- protected identity check: `app/dashboard/page.tsx`

Configure the Supabase Auth email redirect URL for each environment as:

`<APP_URL>/auth/callback`

Use the project's publishable key as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never use a service-role/secret key in `NEXT_PUBLIC_*` variables.
