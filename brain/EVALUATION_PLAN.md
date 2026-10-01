# FieldOps — Evaluation Plan

## Evaluation objective

Determine whether FieldOps works as a coherent production-style field-service system, not merely as a collection of screens.

## Evaluation dimensions

### 1. Workflow completeness
Can the full request → assignment → technician execution → evidence → sign-off → invoice/report path be completed?

### 2. Correctness
Are state transitions, ownership checks, totals, and persistence correct?

### 3. UX
Can each role understand what to do next, especially a technician on a mobile viewport?

### 4. Security
Can unauthorized users access or mutate another customer's/job's data?

### 5. Reliability
Do retries, duplicate submissions, upload failures, and partial failures behave safely?

### 6. Maintainability
Are business rules modular, typed, tested, and documented?

### 7. Production readiness
Are logging, migrations, environment configuration, deployment, backups, and error handling addressed?

## Demonstration scenario

Use one realistic job:

1. Customer submits repair request.
2. Dispatcher assigns technician.
3. Technician starts job.
4. Technician records notes.
5. Technician uploads photos.
6. Technician records parts.
7. Technician completes work.
8. Customer reviews and signs off.
9. System generates invoice/report.
10. Dispatcher/admin can inspect the audit trail.

## Evidence

Evaluation should include:

- Automated test results.
- Browser/e2e recording or screenshots.
- API contract examples.
- Database migration history.
- Security checks.
- Deployment/health evidence.
- Clear README setup instructions.

## Quality gates

A release candidate should have no known blocker in the core workflow, passing critical-path tests, validated authorization, and reproducible setup.
