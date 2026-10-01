# FieldOps — Data Specification

## Core entities

### User
Identity and role information.

Key fields: id, name, email, role, status, created_at, updated_at.

Roles: customer, dispatcher, technician, admin.

### Customer
Business/person receiving service.

Key fields: id, name, contact details, address/site references, created_at, updated_at.

### ServiceRequest
The customer's request before/during dispatch.

Key fields: id, customer_id, site_id, title, description, priority, status, created_at, updated_at.

### Job
Operational unit executed by a technician. A request may map to one job in MVP; the model should not prevent future multiple visits.

Key fields: id, request_id, status, scheduled_start, scheduled_end, started_at, completed_at, completion_notes.

### Assignment
Links a job to a technician.

Key fields: id, job_id, technician_id, assigned_by, assigned_at, unassigned_at.

### WorkLog
Technician work record.

Key fields: id, job_id, technician_id, note, started_at, ended_at, created_at.

### Attachment
Metadata for photos/documents stored outside the database.

Key fields: id, job_id, uploaded_by, storage_key, media_type, size_bytes, created_at.

### PartUsage
Part/material consumed during work.

Key fields: id, job_id, part_name or part_id, quantity, unit_price_snapshot, created_at.

### SignOff
Customer approval record.

Key fields: id, job_id, customer_id, signed_at, signer_name, signature_reference, notes.

### Invoice
Billing artifact generated from job information.

Key fields: id, job_id, number, status, subtotal, tax, total, currency, issued_at, document_reference.

### AuditEvent
Immutable record of important actions.

Key fields: id, actor_id, entity_type, entity_id, action, metadata, created_at.

## Relationships

- Customer 1—N ServiceRequest
- ServiceRequest 1—N Job (future-safe; MVP may use one)
- Job 1—N Assignment
- Job 1—N WorkLog
- Job 1—N Attachment
- Job 1—N PartUsage
- Job 1—0..1 SignOff
- Job 1—0..1 Invoice
- User 1—N AuditEvent

## Invariants

- A job cannot have two active technician assignments.
- A completed job must have required completion data.
- Sign-off belongs to the job being signed.
- Invoice totals must be derived from persisted line/part data, not client-provided totals.
- Attachments must have an authorized owner/context.
- Audit events are append-only.

## Data lifecycle

Soft deletion should be preferred for operational records where auditability matters. Hard deletion requires explicit retention rules.

## Privacy

Customer contact details and signatures are sensitive operational data. Access must be role- and resource-scoped.
