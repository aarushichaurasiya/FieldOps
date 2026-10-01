# FieldOps — Technology Stack

## Proposed v1

| Layer | Choice | Purpose |
|---|---|---|
| Frontend | Next.js + TypeScript | Responsive web application |
| UI | React + accessible component system | Reusable product UI |
| Styling | Tailwind CSS | Consistent responsive styling |
| API | Next.js route handlers or dedicated Node API module | HTTP boundary |
| Database | PostgreSQL | Transactional system of record |
| ORM | Prisma | Typed database access and migrations |
| Validation | Zod | Runtime request/form validation |
| Auth | Auth.js or a managed auth provider | Identity and sessions |
| Object storage | S3-compatible storage | Photos and generated documents |
| Background jobs | Queue/worker abstraction | Async reports, notifications, retries |
| Testing | Vitest + Playwright | Unit/integration and browser tests |
| Deployment | Vercel-compatible web deployment | Web/API hosting |
| CI | GitHub Actions | Automated quality gates |

## Selection principles

1. Prefer TypeScript end-to-end.
2. Prefer a modular monolith before microservices.
3. Prefer managed infrastructure for deployment and storage.
4. Keep vendor-specific code behind adapters.
5. Optimize technician workflows for low friction and mobile screens.
6. Keep local development reproducible.

## Environment separation

- `development`: local services and safe test data.
- `test`: isolated database/storage.
- `staging`: production-like validation.
- `production`: protected secrets, backups, monitoring, and least privilege.

## Stack status

Everything in this document is a proposed v1 choice until confirmed by implementation. Do not treat it as evidence that a dependency already exists in the repository.
