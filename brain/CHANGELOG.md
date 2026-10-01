# FieldOps — Changelog

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
