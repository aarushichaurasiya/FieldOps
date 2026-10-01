# FieldOps — UI Specification

## UX principles

1. Technician-first: critical actions must work comfortably on a phone.
2. Operational clarity: status, ownership, and next action should be obvious.
3. Progressive disclosure: keep secondary data out of the critical path.
4. Evidence over decoration: photos, notes, parts, and sign-off should be easy to capture.
5. Accessible controls: labels, focus states, contrast, touch targets, and keyboard support.

## Primary screens

### Customer
- Sign in
- Request service
- Request details/status
- Job completion and sign-off
- Invoice/report view

### Dispatcher
- Operations dashboard
- Request queue
- Unassigned jobs
- Technician workload
- Job assignment panel
- Job timeline

### Technician
- My jobs
- Job detail
- Start/complete controls
- Work notes
- Photo capture/upload
- Parts used
- Customer sign-off

### Admin
- Users/roles
- Customers
- Configuration
- Audit/reporting

## Technician job screen

The primary mobile screen should show:

1. Customer/site identity.
2. Job status and next action.
3. Equipment/request description.
4. Contact/site details.
5. Work notes.
6. Photo/evidence capture.
7. Parts/materials.
8. Completion checklist.
9. Customer sign-off.

## States

Every data-driven screen should define loading, empty, error, permission-denied, and success states.

## Navigation

Desktop: role-aware sidebar plus contextual page header.

Mobile technician: compact top bar and bottom/inline primary actions where useful.

## Forms

- Inline validation.
- Preserve entered data after recoverable errors.
- Disable duplicate submissions while a mutation is pending.
- Confirm destructive actions.
- Clearly distinguish saved from unsaved state.

## Accessibility target

Target WCAG 2.2 AA practices for core flows, with keyboard access and semantic HTML as baseline requirements.

## Visual direction

Use a professional operations-product visual language: high information density without visual clutter, restrained color usage, strong status indicators, clear typography, and consistent spacing.
