# FieldOps — End-to-End Implementation Plan

This plan converts the FieldOps brain into an executable build sequence. Supabase is the managed backend platform for the production system of record; Vercel is the deployment/runtime platform for the web application and API.

## Infrastructure anchors

- GitHub repository: `aarushichaurasiya/FieldOps`
- Supabase project: `FieldOps`
- Supabase project ref: `vezjdmgatlhxktbrsvwm`
- Supabase region: `ap-northeast-1`
- PostgreSQL: 17
- Vercel: connected deployment platform; exact Vercel project/team mapping must be confirmed before the first deployment.
- Environments: local/development, preview/staging, production.

## Stage 0 — Repository and delivery foundation

**Goal:** make the empty repository buildable and safe to evolve.

Implement:
- Next.js + TypeScript application skeleton.
- Tailwind and accessible component foundation.
- Strict TypeScript, ESLint/formatting, test harness.
- Environment validation with safe `.env.example`.
- Feature/module boundaries matching `brain/REPO_STRUCTURE.md`.
- Health endpoint.
- CI checks: install, lint, typecheck, unit tests, production build.

Supabase:
- Confirm project connectivity.
- Establish local/dev database workflow.
- Define migration ownership.
- Do not expose service-role secrets to the browser.

Vercel:
- Connect GitHub repository.
- Create preview and production deployment targets.
- Add only required environment variables per environment.
- Verify preview deployment from `main`/PR workflow.

**Exit gate:** clean install + tests + production build + deployed skeleton + health check.

## Stage 1 — Supabase database and authentication

**Goal:** establish the secure system of record.

Implement database entities from `DATA_SPEC.md`:
- User/profile
- Customer
- ServiceRequest
- Job
- Assignment
- WorkLog
- Attachment metadata
- PartUsage
- SignOff
- Invoice
- AuditEvent

Implement:
- Foreign keys and indexes.
- Job status constraints.
- Active-assignment invariant.
- Timestamps and audit fields.
- Seed/demo data strategy.
- Auth and role model.

Supabase:
- Use PostgreSQL migrations for schema.
- Enable RLS on every exposed application table.
- Design policies around role + organization/resource ownership.
- Keep authorization data in trusted claims/app metadata or database relationships; never use editable user metadata for authorization.
- Configure Storage buckets later for private job evidence/documents.
- Run Supabase security advisors after schema/RLS work.

Vercel:
- Configure production/preview Supabase URL and publishable key.
- Never expose service-role/secret keys in client code.

**Exit gate:** authenticated users can be identified and authorized; database constraints and RLS prevent cross-user/resource access.

## Stage 2 — Customer request intake

**Goal:** complete the first business action.

Implement:
- Customer dashboard.
- Create service request form.
- Request validation.
- Request detail page.
- Request list/status display.
- Server-side creation and audit event.

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
- Deploy preview and validate the request flow against preview Supabase data.

**Exit gate:** customer creates a request and can only see authorized requests.

## Stage 3 — Dispatcher operations and assignment

**Goal:** turn incoming requests into scheduled/assigned jobs.

Implement:
- Dispatcher dashboard.
- Request queue and filters.
- Request → Job creation/association.
- Technician list.
- Assignment/unassignment.
- Job status lifecycle enforcement.
- Audit events for assignment changes.

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
- Clear loading, offline/error, retry and success states.

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
- Validate Storage/RLS behavior with unauthorized-user tests.

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
- Run generation in a runtime appropriate to document work.
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
- Production Supabase project configuration.
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
