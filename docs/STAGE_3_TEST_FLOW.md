# Stage 3 — real dispatcher/technician test flow

This fixture creates **real Supabase Auth users and real database rows** for the Stage 3 exit test. It does not add mock data to application runtime code.

## Security boundary

The setup script requires a Supabase **secret key**. The secret key bypasses RLS and must stay local/server-side; it is never committed, never prefixed with `NEXT_PUBLIC_`, and never added to Vercel client environment variables.

Supabase documents the Auth Admin `createUser` operation as server-only and supports auto-confirming test users. The fixture therefore creates disposable `.test` accounts without requiring confirmation email delivery.

## Setup

From the repository root:

### Windows CMD

```cmd
set SUPABASE_URL=https://vezjdmgatlhxktbrsvwm.supabase.co
set SUPABASE_SECRET_KEY=PASTE_YOUR_LOCAL_SECRET_KEY_HERE
set STAGE3_TEST_PASSWORD=choose-a-strong-local-test-password
npm run test:stage3:setup
```

Do **not** paste the secret key into chat or commit it to a file.

The script is idempotent for the fixed test organization and test emails. Re-running it resets the test-user passwords to the supplied `STAGE3_TEST_PASSWORD` and preserves the seeded records.

## Accounts

| Role | Email |
|---|---|
| Dispatcher | `dispatcher@fieldops.test` |
| Technician | `technician@fieldops.test` |
| Customer | `customer@fieldops.test` |

All three accounts use the password supplied through `STAGE3_TEST_PASSWORD`.

## Manual Stage 3 exit test

1. Sign in as **customer**.
2. Open `/requests` and confirm the three real service requests exist.
3. Sign out.
4. Sign in as **dispatcher**.
5. Open `/dispatch`.
6. For **HVAC unit not cooling**, choose **Create job**.
7. Open the job.
8. Assign **Stage 3 Technician**.
9. Verify the job changes to **assigned** and the request changes to **scheduled**.
10. Unassign the technician.
11. Verify the job returns to **requested** and the request returns to **accepted**.
12. Assign the technician again.
13. Leave the job assigned. This is the hand-off into Stage 4.

### Expected Stage 3 invariants

- Customer sees only authorized customer data.
- Dispatcher can create/assign jobs.
- Technician must be an active technician membership in the same organization.
- A job cannot have two active assignments.
- Closed assignment rows remain immutable except for their close timestamp.
- Invalid job lifecycle transitions are rejected by PostgreSQL.
- Assignment/job mutations create audit events.
- No OpenRouter or AI service is involved.

## After the exit test

Keep one job assigned to `Stage 3 Technician`. That becomes the real fixture for **Stage 4 — Technician Execution**: start job → work log → parts → completion.
