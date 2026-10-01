# FieldOps — API Specification

## Conventions

Base path: `/api/v1`

JSON requests/responses unless an endpoint explicitly handles multipart uploads.

Use ISO-8601 timestamps and stable string identifiers.

## Authentication

Protected endpoints require an authenticated session/token. Authorization is checked server-side for every resource.

## Response shape

Success:
```json
{ "data": {}, "meta": {} }
```

Error:
```json
{
  "error": {
    "code": "JOB_NOT_ASSIGNABLE",
    "message": "The job cannot be assigned in its current state.",
    "requestId": "..."
  }
}
```

## Core endpoints

### Requests
- `POST /requests` — create service request.
- `GET /requests` — list requests with filters.
- `GET /requests/:id` — retrieve request.
- `PATCH /requests/:id` — update permitted request fields.

### Dispatch
- `GET /dispatch/queue` — dispatcher work queue.
- `POST /jobs/:id/assignments` — assign technician.
- `DELETE /jobs/:id/assignments/:assignmentId` — remove active assignment when allowed.

### Jobs
- `GET /jobs` — list jobs.
- `GET /jobs/:id` — job detail.
- `POST /jobs/:id/start` — start job.
- `POST /jobs/:id/work-logs` — record work.
- `POST /jobs/:id/parts` — record part usage.
- `POST /jobs/:id/complete` — complete job.

### Evidence
- `POST /jobs/:id/attachments/presign` — request upload authorization.
- `POST /jobs/:id/attachments/complete` — finalize attachment metadata.

### Sign-off
- `POST /jobs/:id/sign-off` — record customer approval.

### Billing/reporting
- `POST /jobs/:id/invoice` — generate invoice.
- `GET /jobs/:id/report` — retrieve/report completed job.

## Validation

All externally supplied data is validated at the boundary. Never trust client-calculated totals, role values, ownership, or workflow state.

## Idempotency

Use an idempotency key for operations likely to be retried, especially invoice generation, sign-off submission, and upload finalization.

## Pagination

Collection endpoints should use cursor pagination once result sizes can become large. MVP may use page/limit with a stable maximum.

## Versioning

Breaking changes require a versioned API or explicit migration strategy. Additive fields should not break existing clients.
