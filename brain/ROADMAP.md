# FieldOps — Roadmap

## Phase 0 — Foundation

- Initialize repository structure.
- Add environment configuration.
- Establish database schema and migrations.
- Establish authentication and role model.
- Add CI, linting, typechecking, and test harness.
- Implement basic observability.

## Phase 1 — Core operations

- Customer service request creation.
- Dispatcher request queue.
- Technician assignment.
- Job status lifecycle.
- Role-aware dashboards.

**Exit:** a request can be assigned and tracked.

## Phase 2 — Technician execution

- Mobile technician job screen.
- Work notes/logs.
- Photo/evidence capture.
- Parts/material recording.
- Completion checklist.

**Exit:** technician can complete a real job record.

## Phase 3 — Customer completion

- Customer completion view.
- Digital sign-off.
- Audit timeline.
- Completion confirmation.

**Exit:** completed work has customer approval evidence.

## Phase 4 — Billing/reporting

- Invoice calculation.
- Invoice/report generation.
- Document storage/access.
- Operational reporting.

**Exit:** completed signed-off job produces a consistent business artifact.

## Phase 5 — Production hardening

- Security review.
- Load/performance testing.
- Failure/retry handling.
- Backups and recovery verification.
- Monitoring/alerts.
- Deployment runbook.

## Later enhancements

- Scheduling/calendar.
- Route optimization.
- Recurring maintenance.
- Inventory.
- Notifications.
- Offline-first technician mode.
- Customer communications.
- Third-party integrations.

## Prioritization rule

Prefer work that makes the core service lifecycle more complete, reliable, secure, and demonstrable before adding peripheral features.
