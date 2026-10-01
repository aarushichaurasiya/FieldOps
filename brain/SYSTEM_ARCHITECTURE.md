# FieldOps — System Architecture

## Architectural goal

Use a modular web architecture that keeps business rules on the server, gives technicians a fast responsive client, and leaves room for background processing and external integrations.

## Logical components

```
Customer / Dispatcher / Technician / Admin
                  |
             Web Frontend
                  |
             API / BFF Layer
                  |
        -----------------------
        |    Domain Services   |
        -----------------------
          |       |       |
       Database  Storage  Jobs
          |       |       |
       PostgreSQL Object   Worker
                 Storage   / Queue
                            |
                    Notifications /
                    Invoice/Report
```

## Proposed boundaries

### Web client
Responsible for presentation, navigation, forms, responsive technician workflows, optimistic UI only where safe, and API consumption.

### API
Responsible for authentication, authorization, validation, domain rules, persistence orchestration, audit events, and stable API contracts.

### Database
System of record for users, customers, jobs, assignments, work logs, parts, sign-offs, invoices, and audit records.

### Object storage
Stores photos and generated documents. Database stores metadata and ownership, not binary payloads.

### Background jobs
Used for non-interactive work such as report rendering, notifications, cleanup, and integration retries.

## Request lifecycle

1. Client sends authenticated request.
2. API authenticates identity.
3. API authorizes role and resource access.
4. Input is validated.
5. Domain service applies business rules.
6. Transaction writes state and audit information.
7. API returns a stable response.
8. Async work is queued when appropriate.

## State model

Proposed job states:

`requested → assigned → in_progress → completed → awaiting_signoff → signed_off → invoiced`

Exception states such as `cancelled` should be terminal only when business rules permit.

## Consistency

Transactional workflow changes should use database transactions. File uploads should use a two-step pattern: authorize metadata creation, upload to object storage, then finalize/verify the attachment.

## Scalability direction

Start as a modular monolith. Separate worker processes and external integrations only when workload or deployment boundaries justify them. Avoid premature microservices.

## Reliability

- Idempotency for operations that may be retried.
- Database constraints for invariants.
- Retryable background jobs with bounded attempts.
- Structured error codes.
- Audit trail for critical state transitions.

## Proposed v1 note

The supplied project direction does not prescribe infrastructure. The architecture above is a proposed implementation blueprint and can be adapted after repository constraints are known.
