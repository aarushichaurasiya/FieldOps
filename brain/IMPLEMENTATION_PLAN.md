# FieldOps — End-to-End Implementation Plan

This plan converts the FieldOps brain into an executable build sequence. Supabase is the managed backend platform for the production system of record; Vercel is the deployment/runtime platform for the web application and API.

## Infrastructure anchors

- GitHub repository: `aarushichaurasiya/FieldOps`
- Supabase project: `FieldOps`
- Supabase project ref: `vezjdmgatlhxktbrsvwm`
- Supabase region: `ap-northeast-1`
- PostgreSQL: 17
- Vercel: connected deployment platform; current deployment URL is `https://fieldops-7oqgxy6hv-aarushiinplace-9284.vercel.app`.
- Environments: local/development, preview/staging, production.

## Stage 0 — Repository and delivery foundation

**Status: completed.**

Implemented:
- Next.js + TypeScript application skeleton.
- Tailwind and accessible component foundation.
- Strict TypeScript, ESLint, test harness.
- Environment contract.
- Health endpoint.
- CI checks: install, lint, typecheck, unit tests, production build.

## Stage 1 — Supabase database and authentication

**Status: completed.**

**Goal:** establish the secure system of record.

### Database implemented

- User/profile
- Organization and organization membership
- Customer
- Site
- ServiceRequest
- Job
- Assignment
- WorkLog
- Attachment metadata
- PartUsage
- SignOff
- Invoice and invoice lines
- AuditEvent
- Foreign keys and organization integrity constraints
- Job status enum and timestamp/check constraints
- One-active-technician-assignment invariant
- Operational indexes

### Security implemented

- RLS enabled on every public application table.
- Role + resource scoped policies.
- Private authorization helper functions.
- Auth user → profile provisioning trigger.
- Authorization does not rely on editable user metadata.
- Client grants exclude service-role/secret credentials.
- Security advisor verified with no security lints.

### Next.js authentication implemented

- `@supabase/ssr` browser/server clients.
- Next.js proxy session refresh using `auth.getClaims()`.
- Email/password sign-in and sign-up.
- Email confirmation callback.
- Protected dashboard using server-side user verification.
- Supabase URL + publishable-key environment contract.

### Verification

- 15 application tables verified.
- RLS enabled on 15/15 application tables.
- 30 RLS policies verified.
- Auth profile trigger verified.
- Active-assignment unique index verified.
- Supabase security advisor returned no security lints.
- Production Vercel sign-up, email confirmation, sign-in, and protected `/dashboard` flow verified manually.

### Stage 1 exit verification

- Vercel deployment is live at the current FieldOps deployment URL.
- Supabase URL and publishable key are configured in the deployed application.
- Production and localhost auth callback URLs are configured.
- Production sign-in and protected `/dashboard` were verified with a real Supabase Auth user.
- Service-role/secret keys remain server-only.

**Exit gate: passed. Authenticated users can be identified and the protected dashboard can read the user's profile and membership state.

## Stage 2 — Customer request intake

**Status: implementation in progress; deployed end-to-end verification remains.**

**Goal:** complete the first business action.

Implemented:
- Customer request workspace at `/requests`.
- Create service request form at `/requests/new`.
- Zod request validation.
- Request detail/update page.
- Request list/status display.
- Server-side creation/update with RLS-aware Supabase RPCs.
- Transactional request + audit-event writes inside PostgreSQL functions.
- Customer site visibility tightened to customer-owned sites.
- Customer/status ownership changes blocked at the database trigger layer.

API:
- `POST /api/v1/requests`
- `GET /api/v1/requests`
- `GET /api/v1/requests/:id`
- `PATCH /api/v1/requests/:id`

Supabase:
- Persist requests transactionally.
- Enforce customer ownership with RLS.
- Add indexes for customer/status/date.

Vercel:
- Deploy preview/production and validate the request flow with a provisioned customer account.
- Do not seed placeholder customer/organization rows just to make the UI appear populated.
- First-time authenticated users can provision their own real customer workspace through the constrained onboarding function.

**Exit gate:** provisioned customer creates a real request, sees only authorized requests, and the request/audit write is atomic.

## Stage 3 — Dispatcher operations and assignment

**Status: implementation built; production exit verification pending.**

**Goal:** turn incoming requests into scheduled/assigned jobs.

Implemented:
- Dispatcher dashboard at `/dispatch`.
- Request queue with status, priority, and title filters.
- Request → Job creation/association.
- Technician pool with active workload counts.
- Assignment/reassignment/unassignment.
- Database-enforced job status transition guard.
- Append-only assignment history guard.
- Audit events for job creation, assignment, and unassignment.
- Dispatcher/admin authorization at the database and server layers.
- Route Handlers for queue, job creation, assignment, and unassignment.

API:
- `GET /api/v1/dispatch/queue`
- `POST /api/v1/jobs/:id/assignments`
- `DELETE /api/v1/jobs/:id/assignments/:assignmentId`

Supabase:
- Transactional assignment mutation.
- Constraint against multiple active technician assignments.
- RLS for dispatcher/admin operations.

**Exit gate:** dispatcher can reliably assign a job and the technician sees the assignment.

## Stage 4 — Technician execution

**Goal:** make the core workflow usable from a phone.

Implement:
- Mobile-first technician job screen.
- Start job.
- Work notes/logs.
- Completion checklist.
- Parts/material recording.
- Job completion.
- Loading, offline/error, retry and success states.

API:
- `POST /api/v1/jobs/:id/start`
- `POST /api/v1/jobs/:id/work-logs`
- `POST /api/v1/jobs/:id/parts`
- `POST /api/v1/jobs/:id/complete`

Supabase:
- Enforce technician assignment/resource authorization.
- Use transactions for state transitions.
- Store operational records and audit events.

**Exit gate:** an assigned technician can start, record work/parts, and complete a real job.

## Stage 5 — Evidence and private Storage

**Goal:** make completed work verifiable.

Implement:
- Photo/document capture UI.
- Upload progress and retry.
- Attachment metadata.
- Secure preview/download.
- File type/size validation.
- Two-step upload finalization.

Supabase:
- Private Storage bucket(s) for job evidence and generated documents.
- Storage policies tied to job/resource authorization.
- Database metadata linked to Storage object keys.
- Short-lived signed URLs.
- Unauthorized-user upload/download tests.

API:
- `POST /api/v1/jobs/:id/attachments/presign`
- `POST /api/v1/jobs/:id/attachments/complete`

**Exit gate:** technician can securely upload/view evidence; another customer/technician cannot access it.

## Stage 6 — Customer sign-off and audit trail

**Goal:** establish explicit customer approval.

Implement:
- Customer completion review.
- Job summary/evidence view.
- Digital sign-off.
- Confirmation screen.
- Immutable audit timeline.

API:
- `POST /api/v1/jobs/:id/sign-off`

Supabase:
- Transactionally create sign-off + final audit event.
- Enforce one valid sign-off per job unless an explicit correction workflow is added.
- Protect signature references and customer data.

**Exit gate:** completed work has verifiable customer approval evidence.

## Stage 7 — Billing and reporting

**Goal:** produce the business artifact from the completed job.

Implement:
- Server-derived invoice calculation.
- Invoice status lifecycle.
- Invoice/report generation.
- Download/view document.
- Job completion report.
- Billing audit events.

API:
- `POST /api/v1/jobs/:id/invoice`
- `GET /api/v1/jobs/:id/report`

Supabase:
- Persist invoice/line-item source data.
- Store generated documents in private Storage.
- Make invoice generation idempotent.
- Never trust client-provided totals.

Vercel:
- Run generation in an appropriate runtime.
- Keep generation secrets server-side.
- Add failure/retry handling.

**Exit gate:** a signed-off job produces a consistent invoice/report that can be retrieved securely.

## Stage 8 — End-to-end hardening

**Goal:** prove the whole system works, not just individual screens.

Testing:
- Unit tests for domain rules.
- Integration tests against isolated Supabase database.
- Playwright E2E for the full lifecycle.
- Negative authorization tests.
- Duplicate/retry/idempotency tests.
- Upload failure tests.
- Invoice calculation tests.

Supabase:
- Security advisors.
- RLS policy review.
- Query/index/performance review.
- Backup/recovery verification.
- Logs review for database/API failures.

Vercel:
- Production build verification.
- Preview-to-production promotion workflow.
- Runtime error monitoring.
- Deployment rollback procedure.
- Environment-variable audit.
- Performance review.

**Exit gate:** full demo workflow passes from customer request through invoice/report with no known critical security or correctness issue.

## Stage 9 — Production release

**Goal:** launch a stable production version.

Production checklist:
- Custom production domain.
- HTTPS.
- Production Supabase configuration.
- Production secrets.
- Database migration procedure.
- Storage policies.
- Auth redirect configuration.
- Error monitoring.
- Structured logs.
- Backup/recovery runbook.
- CI required checks.
- Deployment rollback plan.
- README/runbook updated.

**Release scenario:**

Customer request → dispatcher assignment → technician execution → notes/photos/parts → completion → customer sign-off → invoice/report → audit review.

## Stage 10 — Post-MVP enhancements

Only after the core lifecycle is stable:
- Scheduling/calendar.
- Route optimization.
- Recurring maintenance.
- Inventory.
- Notifications.
- Offline-first technician mode.
- Customer communications.
- Third-party integrations.
- Analytics.

## Definition of done

FieldOps is considered MVP-complete only when:

1. The complete business lifecycle works end-to-end.
2. Every protected resource has server-side authorization.
3. Supabase RLS and Storage policies are verified.
4. Critical mutations are transactional/idempotent where needed.
5. Evidence and generated documents are private and securely accessible.
6. Invoice totals are server-derived.
7. Audit history exists for critical actions.
8. Unit/integration/E2E critical-path tests pass.
9. Vercel preview and production deployments are reproducible.
10. Production secrets are separated from development/preview.
11. The system can be demonstrated from one realistic job without manual database intervention.

## Implementation rule

Build strictly in stage order unless a dependency requires otherwise. Do not add later-stage features before the current stage's exit gate passes. Keep FieldOps independent from EventApp and other projects.
