# FieldOps — Repository Structure

## Target structure

```
FieldOps/
├─ brain/
│  ├─ PROJECT_BRIEF.md
│  ├─ PRD.md
│  ├─ SYSTEM_ARCHITECTURE.md
│  ├─ TECH_STACK.md
│  ├─ REPO_STRUCTURE.md
│  ├─ DATA_SPEC.md
│  ├─ API_SPEC.md
│  ├─ UI_SPEC.md
│  ├─ EVALUATION_PLAN.md
│  ├─ TESTING_STRATEGY.md
│  ├─ SECURITY.md
│  ├─ DECISIONS.md
│  ├─ ROADMAP.md
│  ├─ CODING_RULES.md
│  ├─ AGENTS.md
│  ├─ CHANGELOG.md
│  └─ README.md
├─ app/                 # web routes/screens
├─ components/          # shared UI
├─ features/            # domain-oriented feature modules
│  ├─ requests/
│  ├─ dispatch/
│  ├─ jobs/
│  ├─ customers/
│  ├─ billing/
│  └─ reports/
├─ server/              # server-only application/domain logic
├─ lib/                 # shared infrastructure helpers
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ public/
├─ scripts/
├─ .env.example
├─ package.json
└─ README.md
```

## Organization rules

- Organize business code by domain rather than by arbitrary technical type where practical.
- Keep secrets out of the repository.
- Keep server-only imports out of client modules.
- Keep generated files out of source control unless required for deployment.
- Keep migrations versioned.
- Keep tests close to the behavior they protect or in the dedicated test tree consistently.

## Current repository status

The repository was empty when this brain was created. This document describes the target structure, not an assertion that these application directories already exist.
