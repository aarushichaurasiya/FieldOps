# FieldOps — Project Freeze & Engineering Dossier

**Freeze point:** 03 October 2026  
**Repository:** https://github.com/aarushichaurasiya/FieldOps  
**Production:** https://fieldops-fawn.vercel.app

## 1. Project Vision

FieldOps is a production-style field-service management platform for companies whose technicians visit customer sites to install, repair, inspect, or maintain equipment.

The core idea is to replace disconnected request, dispatch, execution, approval and billing steps with one controlled workflow:

**Customer request → Dispatcher triage → Job creation → Technician assignment → Technician execution → Customer sign-off → Invoice → Payment → Service report**

## 2. Problem Statement

Field-service teams need a shared system where:

- requests are connected to real jobs;
- dispatchers can assign technicians;
- technicians can work from a focused mobile-friendly screen;
- work logs and parts become part of the job record;
- customer approval is explicit;
- invoices and service reports are generated from completed service data.

## 3. Product Approach

The implementation follows several principles:

1. Model business workflow as explicit states instead of unrelated CRUD screens.
2. Separate the user experience by role: dispatcher, technician, customer.
3. Put sensitive workflow mutations behind authenticated server/database controls.
4. Use PostgreSQL RLS as an authorization boundary, not only frontend visibility.
5. Record audit events around important business transitions.
6. Validate with a real production scenario, not only local development.

## 4. Architecture

```text
 Customer ───────┐
                 │
 Dispatcher ─────┼──> Next.js Application ───> Supabase Auth
                 │       │
 Technician ────┘       └───────────────> PostgreSQL + RLS
                                             │
                          Requests / Jobs / Work Logs / Parts
                          Sign-offs / Invoices / Audit Events
```

### Application layer

- Next.js 16
- React 19.2
- TypeScript
- App Router
- Role-specific pages
- Server actions and API routes

### Backend/data layer

- Supabase Auth / SSR
- Supabase PostgreSQL 17
- Row Level Security
- Protected database functions
- Audit-event records

### Deployment

- Vercel production deployment

## 5. Solution Modules

- Customer service request management
- Dispatcher request triage and job creation
- Technician assignment
- Technician execution workspace
- Start work / work logs / parts / completion
- Customer completion review and sign-off
- Invoice draft generation
- Invoice issue and payment state
- Service report generation
- Print / Save PDF
- Audit events

## 6. Implementation Plan and Status

| Workstream | Status | Freeze-point evidence | Next action |
|---|---|---|---|
| Foundation/auth/roles | Completed | Production accounts for dispatcher, technician and customer tested | Regression coverage |
| Service requests | Completed | Requests visible and linked to jobs | Add filtering/search |
| Job creation | Completed | Real HVAC job created | Add automated test |
| Technician assignment | Completed | Assignment/state transition tested | Add workload/calendar view |
| Technician execution | Completed | Start, logs, parts, completion tested | Verify photo workflow |
| Customer sign-off | Completed | Real production sign-off succeeded | Add edge-case tests |
| Invoice lifecycle | Completed | Real invoice created, issued and paid | Test tax/labor/multi-line/concurrency |
| Service report | Completed | Report opened and printed | Improve export/branding if desired |
| Photos/attachments | Partially done / not fully verified | Product requirement exists, complete production verification not established | Secure upload + report inclusion |
| Operations dashboard | Remaining | Core workflow exists | Build KPI/filter dashboard |
| Scheduling/route planning | Remaining | Assignment exists, full scheduling not established | Calendar/workload/SLA view |
| Automated E2E tests | Remaining | Manual production workflow verified | Automate critical lifecycle |
| Formal security assessment | Remaining | RLS/protected functions implemented | Authorization matrix + abuse cases |
| Observability | Remaining | Production deployment exists | Structured logging/monitoring |

## 7. Freeze-Point Production Scenario

A real production HVAC job was used as the end-to-end validation scenario.

- Customer: Stage 3 Customer
- Technician: Stage 3 Technician
- Site: Chennai Service Site
- Job ID: `20cf9c15-d262-4351-af33-70ed1e2820af`
- Service: HVAC unit not cooling
- Parts: hardware × 25
- Unit amount: ₹5,600
- Invoice: `INV-20261003-5667BEF6`
- Invoice total: ₹1,40,000
- Invoice lifecycle: `draft → issued → paid`
- Service report: printed successfully

## 8. Visual Evidence

The repository now contains an ordered screenshot set covering the freeze-point workflow. The screenshots are organized by business stage so a reviewer can follow the same lifecycle described above.

| # | Evidence | File |
|---|---|---|
| 01 | Dispatcher dashboard | [`01-dispatcher-dashboard.png`](screenshots/01-dispatcher-dashboard.png) |
| 02 | Job dispatch | [`02-job-dispatch.png`](screenshots/02-job-dispatch.png) |
| 03 | Technician workspace | [`03-technician-workspace.png`](screenshots/03-technician-workspace.png) |
| 04 | Technician execution | [`04-technician-execution.png`](screenshots/04-technician-execution.png) |
| 05 | Job completed | [`05-job-completed.png`](screenshots/05-job-completed.png) |
| 06 | Customer sign-off | [`06-customer-signoff.png`](screenshots/06-customer-signoff.png) |
| 07 | Invoice | [`07-invoice.png`](screenshots/07-invoice.png) |
| 08 | Invoice paid | [`08-invoice-paid.png`](screenshots/08-invoice-paid.png) |
| 09 | Service report | [`09-service-report.png`](screenshots/09-service-report.png) |

See the [screenshot evidence index](screenshots/README.md) for the complete set.

## 9. Execution Lessons

### Authorization must be enforced below the UI

Some mutations initially encountered RLS/server-control restrictions. The implementation was strengthened with protected server/database mutation paths rather than weakening authorization just to make the UI work.

### State transitions are business rules

Create, assign, start, complete, sign off, issue and pay are not ordinary CRUD operations. Each transition has prerequisites and should be enforced accordingly.

### Production verification matters

The workflow was tested against the deployed application, which verified integration between UI, authentication, database authorization, business state and billing/reporting.

### Billing should consume operational data

The invoice was generated from the actual completed service record, including the real parts usage, instead of using unrelated mock invoice data.

## 10. Exceptions / Caveats

This freeze point is a stable engineering baseline, not a formal declaration of enterprise production readiness.

The following remain outside the completed baseline or need deeper verification:

- full photo/attachment workflow;
- advanced scheduling and route planning;
- SLA/overdue management;
- automated E2E coverage;
- formal penetration testing;
- production observability/alerting;
- broad billing edge-case testing.

## 11. Next Phase

The recommended next phase is **Operations & Audit Hardening**:

1. Dispatcher command center.
2. Job/request/invoice KPI cards.
3. Search and filters.
4. Technician workload and scheduling.
5. SLA and overdue indicators.
6. Secure photo/attachment capture.
7. Audit timeline UI.
8. Automated lifecycle regression tests.
9. Authorization matrix tests.
10. Monitoring and structured error reporting.

## 12. Freeze Rule

The freeze point means the verified core lifecycle should now be treated as the stable baseline. Future development should be implemented as explicit feature work on top of this baseline rather than casually changing the verified workflow.

**Frozen baseline:**

`Request → Dispatch → Technician execution → Customer sign-off → Invoice → Issued → Paid → Service report`
