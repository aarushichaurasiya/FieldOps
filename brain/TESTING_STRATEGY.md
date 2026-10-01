# FieldOps — Testing Strategy

## Testing pyramid

### Unit tests
Test pure domain rules and calculations:
- job state transitions
- invoice totals
- assignment rules
- validation
- authorization predicates

### Integration tests
Test API + database behavior:
- request creation
- assignment
- job completion
- attachment metadata
- sign-off
- invoice generation
- audit events

### End-to-end tests
Test the real user workflow in a browser:
- customer request
- dispatcher assignment
- technician completion
- customer sign-off
- report/invoice access

## Critical test matrix

| Area | Unit | Integration | E2E |
|---|---:|---:|---:|
| Request creation | ✓ | ✓ | ✓ |
| Assignment | ✓ | ✓ | ✓ |
| Technician job flow | ✓ | ✓ | ✓ |
| Photos | ✓ | ✓ | ✓ |
| Parts | ✓ | ✓ | ✓ |
| Sign-off | ✓ | ✓ | ✓ |
| Invoice/report | ✓ | ✓ | ✓ |
| Authorization | ✓ | ✓ | ✓ |
| Audit trail |  | ✓ | ✓ |

## Negative testing

Include:
- invalid IDs
- missing required fields
- duplicate submission
- unauthorized role
- wrong customer/job ownership
- invalid state transition
- oversized/invalid attachment
- stale concurrent update
- failed downstream storage/job

## Test data

Use deterministic factories/fixtures. Never use real customer information.

## CI gates

At minimum:
1. format/lint
2. typecheck
3. unit tests
4. integration tests
5. production build
6. e2e tests where environment permits

A failing critical-path test blocks release.
