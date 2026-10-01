# FieldOps — Coding Rules

## General

- Use TypeScript with strict type checking.
- Prefer small modules with explicit responsibilities.
- Keep business rules deterministic and testable.
- Avoid unnecessary abstraction until repeated behavior exists.
- Do not commit secrets or real customer data.

## Naming

- Use clear domain names: `ServiceRequest`, `Assignment`, `SignOff`.
- Prefer verb-based function names for mutations.
- Avoid generic names such as `data`, `thing`, or `helper` when a domain name exists.

## API

- Validate input at the boundary.
- Return stable error codes.
- Enforce authorization in server code.
- Do not expose database implementation details in API contracts.
- Use transactions for multi-write workflow transitions.

## Database

- Use migrations for schema changes.
- Add constraints for important invariants.
- Index fields used by common filters and foreign-key lookups.
- Never depend solely on application code for uniqueness where the database can enforce it.

## Frontend

- Keep components focused.
- Use accessible semantic elements.
- Model loading/error/empty/success states.
- Avoid duplicated API logic.
- Never place server secrets in client bundles.

## Errors and logging

- Use structured logs.
- Include request/correlation IDs where practical.
- Do not log credentials, tokens, signatures, or unnecessary personal data.
- Convert expected domain failures into actionable user-facing messages.

## Tests

- Test business rules, not implementation trivia.
- Every critical workflow mutation needs automated coverage.
- Add regression tests when fixing bugs.

## Git

- Make commits small and meaningful.
- Use imperative commit messages.
- Avoid committing generated artifacts unless intentionally required.
- Keep documentation synchronized with behavior.
