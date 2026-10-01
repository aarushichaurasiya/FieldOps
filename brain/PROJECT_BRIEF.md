# FieldOps — Project Brief

## 1. Product

FieldOps is a production-style field-service operations platform for companies whose technicians visit customer locations to install or repair equipment.

## 2. Core workflow

Customer creates a service request → dispatcher assigns a technician → technician receives a mobile-friendly job screen → technician records work, photos, and parts used → customer signs off → invoice/report is generated.

## 3. Users

- **Customer:** creates requests, views status, reviews completed work, signs off.
- **Dispatcher:** monitors requests and assigns work to technicians.
- **Technician:** executes assigned jobs, records evidence, parts, notes, and completion.
- **Company/admin:** manages operational data, users, reporting, and configuration.

These roles are proposed from the workflow; exact permissions are implementation decisions.

## 4. Product goals

1. Make service-request intake structured and traceable.
2. Give dispatchers clear assignment and workload visibility.
3. Make technician workflows fast on mobile devices.
4. Preserve an auditable record of work performed.
5. Capture customer approval digitally.
6. Produce a consistent invoice/report output.

## 5. Non-goals for the first release

- Full ERP/accounting replacement.
- Advanced route optimization.
- Complex payroll management.
- IoT/device telemetry.
- Multi-country tax compliance.
- Native mobile apps before the responsive web workflow is proven.

## 6. Core entities

Customer, service request/job, technician, dispatcher, assignment, work log, photo/evidence, part usage, customer sign-off, invoice, report.

## 7. Success signals

- A request can move end-to-end without manual database edits.
- Every job has an accountable assignee.
- Technicians can complete a job from a phone-sized screen.
- Completion evidence is attached to the job.
- Customer approval is linked to the completed work.
- Invoice/report generation uses the recorded job data.

## 8. Assumptions

The supplied project direction defines the business workflow but does not specify a framework, database, deployment provider, authentication provider, billing provider, or exact UI. The rest of the brain documents therefore describe a proposed v1 engineering design, not already-existing implementation facts.
