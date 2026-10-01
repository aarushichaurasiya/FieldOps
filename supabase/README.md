# FieldOps Supabase

Stage 1+ uses Supabase project `vezjdmgatlhxktbrsvwm`.

## Live database

- Region: `ap-northeast-1`
- PostgreSQL: 17
- `20261001053004_stage_1_core_schema_auth_rls`
- `20261001053018_stage_1_fk_indexes`
- `20261001063316_stage_3_dispatcher_operations`
- `20261001063339_stage_3_dispatcher_function_security`

Stage 2 request-intake SQL was applied to the live project during implementation and is retained in `supabase/migrations/20261001115000_stage_2_request_intake.sql` for reproducibility. The live migration ledger predates that implementation record, so do not treat the ledger alone as proof that Stage 2 SQL was originally applied.

Before future local database work, pull the remote schema/migration state with the Supabase CLI and reconcile any migration-history drift before applying new migrations.

## Stage 1 guarantees

- 15 application tables are present.
- RLS is enabled on all 15 application tables.
- Auth user creation creates a matching public profile.
- Organization memberships carry the application role.
- Cross-organization relationships use composite foreign keys where required.
- A job can have only one active technician assignment.
- Client grants are intentionally limited; workflow write policies are added with the corresponding business stage.
- Private authorization helpers live in the non-exposed `private` schema.
- No service-role/secret key belongs in browser code.

## Stage 2 request intake

- `service_requests` remains the system-of-record table; no mock request store was added.
- Customer request create/update uses security-invoker PostgreSQL functions so RLS still evaluates the caller's session.
- Request + audit-event writes occur in the same database transaction.
- Customer site reads are restricted to sites owned by the authenticated customer.
- Customer request updates cannot change organization, customer, site, or workflow status.

## Stage 3 dispatcher operations

- Dispatcher/admin-only job mutation policy.
- Transactional request → job creation.
- Transactional technician assignment, reassignment, and unassignment.
- One active assignment invariant plus immutable assignment history.
- Job status transition guard.
- Assignment/job audit events.
- Technician visibility is limited to active technician memberships in organizations the dispatcher can access.
- No OpenRouter or AI dependency is used.

## Authentication

The Next.js application uses `@supabase/ssr` with:

- browser client: `lib/supabase/client.ts`
- server client: `lib/supabase/server.ts`
- generated database types: `lib/database.types.ts`
- session refresh: `lib/supabase/proxy.ts` + root `proxy.ts`
- sign-in/sign-up: `app/auth/login/page.tsx`
- email confirmation: `app/auth/callback/route.ts`
- protected identity check: `app/dashboard/page.tsx`

Configure the Supabase Auth email redirect URL for each environment as:

`<APP_URL>/auth/callback`

Use the project's publishable key as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never use a service-role/secret key in `NEXT_PUBLIC_*` variables.
