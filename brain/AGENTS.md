# FieldOps — Agent Instructions

## Mission

Build and maintain FieldOps as a production-style field-service operations platform.

## Source of truth

Read the files in `brain/` before making architecture or product changes.

The supplied project direction defines the core workflow:

Customer request → dispatcher assignment → technician mobile job → work/photos/parts → customer sign-off → invoice/report.

When implementation evidence conflicts with a proposed brain document, inspect the repository and update the relevant decision/document rather than silently assuming.

## Rules for coding agents

1. Do not mix FieldOps requirements with unrelated projects.
2. Inspect existing code before editing.
3. Preserve working behavior unless the task explicitly changes it.
4. Prefer minimal, coherent changes over broad rewrites.
5. Follow CODING_RULES.md and SECURITY.md.
6. Add or update tests for behavior changes.
7. Update documentation when architecture or product behavior changes.
8. Never invent credentials, secrets, customer records, or external service IDs.
9. Never bypass authorization to make a feature work.
10. Do not mark work complete without verifying the affected path.

## Implementation workflow

1. Read relevant brain documents.
2. Inspect repository structure and existing implementation.
3. Identify affected domain and dependencies.
4. Implement the smallest complete change.
5. Run format/lint/typecheck/tests relevant to the change.
6. Review security and failure cases.
7. Update brain documents if decisions changed.
8. Commit with a clear message.

## Decision discipline

If a requirement is ambiguous, choose the smallest reversible design that preserves the core workflow and document the decision in DECISIONS.md.

## Definition of done

A feature is done when it is implemented, authorized, validated, tested, documented where needed, and verified in the intended user workflow.
