# FieldOps

FieldOps is a production-style field-service operations platform for managing customer requests, dispatch, technician execution, customer approval, billing, and service reporting in one controlled workflow.

## Core workflow

**Customer request → Dispatcher triage → Job creation → Technician assignment → Technician execution → Customer sign-off → Invoice → Payment → Service report**

## Production freeze point

**03 October 2026** — the core workflow was verified against the deployed application using a real end-to-end HVAC service scenario.

Verified lifecycle:

`Request → Dispatch → Technician execution → Customer sign-off → Invoice → Issued → Paid → Service report`

## Technology

- Next.js 16 + App Router
- React 19.2
- TypeScript
- Supabase Auth / SSR
- PostgreSQL 17
- Row Level Security (RLS)
- Protected database functions
- Vercel deployment

## Verified capabilities

- Role-specific customer, dispatcher, and technician workspaces
- Service request triage and job creation
- Technician assignment
- Start work, work logs, parts/materials, and completion
- Customer completion review and sign-off
- Invoice draft → issued → paid lifecycle
- Service report generation
- Browser Print / Save PDF workflow
- Audit-event records around important business transitions

## Visual evidence

The repository includes screenshots captured during the verified workflow. The filenames are organized by workflow stage for easier review.

| Stage | Evidence |
|---|---|
| Dispatcher | [01 — Dispatcher dashboard](docs/screenshots/01-dispatcher-dashboard.png) |
| Dispatch | [02 — Job dispatch](docs/screenshots/02-job-dispatch.png) |
| Technician | [03 — Technician workspace](docs/screenshots/03-technician-workspace.png) |
| Execution | [04 — Technician execution](docs/screenshots/04-technician-execution.png) |
| Completion | [05 — Job completed](docs/screenshots/05-job-completed.png) |
| Customer | [06 — Customer sign-off](docs/screenshots/06-customer-signoff.png) |
| Billing | [07 — Invoice](docs/screenshots/07-invoice.png) |
| Payment | [08 — Invoice paid](docs/screenshots/08-invoice-paid.png) |
| Reporting | [09 — Service report](docs/screenshots/09-service-report.png) |

## Documentation

- [Project Freeze & Engineering Dossier](docs/FIELDOPS_PROJECT_DOSSIER.md)
- [Full Audit Report](docs/FIELDOPS_AUDIT_REPORT.md)
- [Freeze Point](docs/FREEZE_POINT.md)
- [Screenshot evidence](docs/screenshots/)

## Production

Live application: https://fieldops-fawn.vercel.app

Repository: https://github.com/aarushichaurasiya/FieldOps

## Next phase

The frozen core should remain stable while future work is added explicitly. Planned areas include:

- Operations dashboard and KPI views
- Search/filtering
- Technician workload and scheduling
- SLA/overdue visibility
- Secure photos/attachments
- Audit timeline UI
- Automated E2E regression tests
- Authorization matrix testing
- Monitoring and observability

## Freeze rule

The verified core lifecycle is the stable baseline. Future development should be implemented as explicit feature work on top of this baseline rather than casually changing its verified state transitions.
