# FieldOps — Product Requirements Document

## Product statement

FieldOps coordinates field-service work from request intake through technician completion, customer sign-off, and invoice/report generation.

## Personas

### Customer
Needs to request service, understand status, review what was done, and approve completion.

### Dispatcher
Needs a reliable queue of requests, technician availability/assignment visibility, and operational status tracking.

### Technician
Needs a focused mobile job view with customer/site details, job instructions, status controls, notes, photos, parts, and completion.

### Admin
Needs user, customer, operational, and reporting controls.

## Functional requirements

### FR-01 Request intake
A customer can create a service request with customer/site information, issue description, priority, and relevant equipment details.

**Acceptance:** valid requests receive an identifier and an initial status.

### FR-02 Dispatch
A dispatcher can view unassigned requests and assign a technician.

**Acceptance:** assignment records technician, dispatcher, timestamp, and job status transition.

### FR-03 Technician job view
A technician can view assigned jobs in a mobile-friendly interface.

**Acceptance:** the technician can see the information required to perform the visit without navigating through unrelated screens.

### FR-04 Work execution
A technician can start, pause where supported, and complete work while recording notes and work details.

**Acceptance:** completion is blocked when mandatory completion data is missing.

### FR-05 Evidence
A technician can attach job photos/evidence.

**Acceptance:** uploaded evidence is associated with the correct job and uploader.

### FR-06 Parts
A technician can record parts/materials used.

**Acceptance:** each part usage records item, quantity, and job association.

### FR-07 Customer sign-off
A completed job can be presented for customer approval/sign-off.

**Acceptance:** the sign-off is stored with timestamp and job reference.

### FR-08 Invoice/report
The system can generate an invoice/report from completed job data.

**Acceptance:** generated output identifies the job and summarizes recorded work, parts, and customer approval state.

### FR-09 Auditability
Important workflow transitions are traceable.

**Acceptance:** assignment, completion, sign-off, and invoice/report generation have timestamps and actors.

## Operational requirements

- Responsive UI with technician-first mobile behavior.
- Server-side authorization on every protected operation.
- Durable storage for transactional records.
- Validation at API boundaries.
- Structured logs and error responses.
- Automated tests for critical workflow transitions.

## MVP release boundary

The MVP is the complete happy path from request creation to report/invoice output, with authentication, role-based access, evidence capture, and audit history.

## Future scope

Scheduling calendars, route optimization, recurring maintenance, inventory management, customer notifications, richer analytics, offline-first synchronization, and integrations can be added after the core workflow is stable.
