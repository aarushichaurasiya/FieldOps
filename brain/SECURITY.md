# FieldOps — Security

## Security objectives

Protect customer data, operational records, uploaded evidence, signatures, credentials, and billing information while preserving an auditable workflow.

## Authentication

- Use secure session/token handling.
- Store password credentials only through a trusted auth implementation if passwords are supported.
- Rotate/revoke sessions appropriately.
- Protect privileged routes.

## Authorization

Use role-based access plus resource ownership checks.

Examples:
- Customer can access only their requests/jobs.
- Technician can access assigned jobs and permitted operational data.
- Dispatcher can manage jobs within their organization.
- Admin can manage privileged configuration.

Never rely on hidden UI controls as authorization.

## Input security

- Validate every API input.
- Normalize/limit user-controlled strings.
- Use parameterized database queries/ORM APIs.
- Escape output appropriately.
- Reject unexpected fields where appropriate.

## File security

- Restrict allowed media types and sizes.
- Generate randomized object keys.
- Never expose private storage credentials to clients.
- Use short-lived signed upload/download URLs.
- Verify attachment ownership before access.

## Billing security

Invoice totals are server-derived. Never accept a client-provided total as authoritative.

## Secrets

- Keep secrets in environment/secret managers.
- Commit only safe example variables.
- Rotate compromised credentials.
- Do not log tokens, signatures, passwords, or sensitive customer data.

## Auditability

Record security-relevant actions such as assignment, completion, sign-off, invoice generation, role changes, and privileged data changes.

## Abuse controls

Apply rate limits to authentication, public request creation, uploads, and expensive generation endpoints.

## Threat model focus

Primary threats:
- broken object-level authorization
- account/session compromise
- malicious file uploads
- API abuse
- data leakage through logs
- replay/duplicate mutations
- insecure signed URLs

## Security baseline

Security is part of the feature definition for every protected workflow, not a final cleanup step.
