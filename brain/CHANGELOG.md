# FieldOps — Changelog

## 2026-10-01 — Stage 2 request intake

- Added the White Lilac `#F8F8F9` + Dark Blue `#111439` visual system with gradient accents.
- Added customer request list, creation, detail, and update screens.
- Added Zod boundary validation and `/api/v1/requests` route handlers.
- Added RLS-aware PostgreSQL functions for transactional request + audit-event mutations.
- Tightened customer site SELECT visibility to customer-owned sites.
- Added a database trigger preventing customer ownership/status mutation and keeping workflow status server-controlled.
- Added a Stage 2 migration record and RLS contract test notes.
- No mock customer, organization, or service-request data was added.
- Added constrained self-service customer workspace provisioning for authenticated users without an existing membership.


## 2026-10-01

### Stage 1 — Supabase database and authentication

- Created the FieldOps Supabase schema for organizations, profiles, memberships, customers, sites, service requests, jobs, assignments, work logs, attachments, part usage, sign-offs, invoices, invoice lines, and audit events.
- Added PostgreSQL enums, foreign keys, composite organization integrity constraints, timestamps, checks, and indexes.
- Added the one-active-technician-assignment invariant.
- Enabled RLS across all 15 public application tables.
- Added role/resource-scoped RLS policies and private authorization helper functions.
- Added the Auth user creation trigger that provisions a profile.
- Added Supabase SSR authentication utilities, login/signup, email confirmation callback, session refresh, and protected dashboard.
- Verified Supabase security advisors with no security lints.
- Verified the Stage 1 table/RLS/policy/auth-trigger/index checks against the live project.

### Stage 0 — Foundation

- Created the Next.js/TypeScript/Tailwind/Vitest foundation and CI workflow.
