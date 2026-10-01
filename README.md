# FieldOps

FieldOps is a production-style field-service operations platform.

## Core workflow

Customer request → dispatcher assignment → technician execution → work/photos/parts → customer sign-off → invoice/report.

## Stage 0

The repository currently contains the application foundation:

- Next.js App Router + TypeScript
- Tailwind CSS
- Environment configuration
- Health endpoint
- Vitest test harness
- ESLint + TypeScript verification
- Production build configuration
- GitHub/Vercel-ready project structure

No Supabase schema or authentication is implemented yet. Those belong to Stage 1.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Health check:

```text
http://localhost:3000/api/health
```

## Verification

```bash
npm run verify
```

## Project brain

Read the `brain/` directory before making architecture or workflow changes.
