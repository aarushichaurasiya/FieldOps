# FieldOps — Architecture Decisions

## ADR-001: Modular monolith first

**Decision:** Start FieldOps as a modular monolith.

**Why:** The product workflow is tightly connected. A single deployable application reduces operational complexity while preserving domain boundaries.

**Revisit when:** independent scaling, team ownership, or deployment isolation becomes a demonstrated need.

## ADR-002: PostgreSQL as system of record

**Decision:** Use relational storage for transactional operational data.

**Why:** Requests, assignments, workflow states, parts, sign-offs, and invoices have strong relationships and invariants.

## ADR-003: Responsive web before native apps

**Decision:** Build the technician experience as a mobile-first responsive web interface before investing in native applications.

**Why:** It supports the core workflow with one deployable client and validates UX assumptions earlier.

## ADR-004: Object storage for binary evidence

**Decision:** Store photos/documents in object storage and metadata in the database.

**Why:** Keeps transactional tables efficient and supports signed access patterns.

## ADR-005: Server-owned workflow transitions

**Decision:** Clients request state changes; the server decides whether transitions are valid.

**Why:** Prevents clients from bypassing business rules.

## ADR-006: Audit critical actions

**Decision:** Record immutable audit events for important workflow changes.

**Why:** Field service operations require traceability when work, approval, and billing are disputed.

## ADR-007: Proposed stack, not repository fact

**Decision:** Treat TECH_STACK.md choices as proposals until code establishes the actual implementation.

**Why:** The original project direction specifies the business problem, not implementation technology.
