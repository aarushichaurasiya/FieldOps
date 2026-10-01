#!/usr/bin/env node

/**
 * FieldOps Stage 3 test fixture setup.
 *
 * This script is intentionally separate from application runtime code.
 * It uses a Supabase secret key only from the local process environment to
 * create auto-confirmed test Auth users and seed one realistic organization.
 *
 * Required:
 *   SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 *   STAGE3_TEST_PASSWORD
 *
 * Run:
 *   npm run test:stage3:setup
 *
 * Never commit the secret key or put it in NEXT_PUBLIC_* variables.
 */

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const TEST_PASSWORD = process.env.STAGE3_TEST_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !TEST_PASSWORD) {
  console.error(
    "Missing SUPABASE_URL, SUPABASE_SECRET_KEY, or STAGE3_TEST_PASSWORD.",
  );
  process.exit(1);
}

if (TEST_PASSWORD.length < 12) {
  console.error("STAGE3_TEST_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  "Content-Type": "application/json",
};

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const detail =
      typeof body === "string" ? body : JSON.stringify(body, null, 2);
    throw new Error(`${options.method ?? "GET"} ${path} failed (${response.status}): ${detail}`);
  }

  return body;
}

async function adminUsers() {
  const body = await request("/auth/v1/admin/users?per_page=1000");
  return body?.users ?? [];
}

async function ensureAuthUser(email, fullName) {
  const users = await adminUsers();
  const existing = users.find((user) => user.email?.toLowerCase() === email);

  if (existing) {
    await request(`/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
    });
    console.log(`Updated test user: ${email}`);
    return existing.id;
  }

  const created = await request("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });

  console.log(`Created test user: ${email}`);
  return created.id;
}

async function upsert(table, row, conflictColumns) {
  const body = await request(
    `/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictColumns)}`,
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(row),
    },
  );

  if (!Array.isArray(body) || !body[0]) {
    throw new Error(`No row returned while upserting ${table}.`);
  }

  return body[0];
}

async function findOne(table, filters) {
  const params = new URLSearchParams({
    select: "*",
    limit: "1",
  });

  for (const [key, value] of Object.entries(filters)) {
    params.set(key, `eq.${value}`);
  }

  const rows = await request(`/rest/v1/${table}?${params.toString()}`);
  return rows?.[0] ?? null;
}

async function ensureRequest(organizationId, customerId, siteId, title, description, priority) {
  const existing = await findOne("service_requests", {
    organization_id: organizationId,
    title,
  });

  if (existing) return existing;

  const rows = await request("/rest/v1/service_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      organization_id: organizationId,
      customer_id: customerId,
      site_id: siteId,
      title,
      description,
      priority,
      status: "submitted",
    }),
  });

  return rows[0];
}

async function main() {
  const dispatcherId = await ensureAuthUser(
    "dispatcher@fieldops.test",
    "Stage 3 Dispatcher",
  );
  const technicianId = await ensureAuthUser(
    "technician@fieldops.test",
    "Stage 3 Technician",
  );
  const customerUserId = await ensureAuthUser(
    "customer@fieldops.test",
    "Stage 3 Customer",
  );

  const organization = await upsert(
    "organizations",
    {
      name: "FieldOps Stage 3 Lab",
      slug: "fieldops-stage-3-lab",
    },
    "slug",
  );

  await upsert(
    "organization_memberships",
    {
      organization_id: organization.id,
      user_id: dispatcherId,
      role: "dispatcher",
      status: "active",
    },
    "organization_id,user_id",
  );

  await upsert(
    "organization_memberships",
    {
      organization_id: organization.id,
      user_id: technicianId,
      role: "technician",
      status: "active",
    },
    "organization_id,user_id",
  );

  await upsert(
    "organization_memberships",
    {
      organization_id: organization.id,
      user_id: customerUserId,
      role: "customer",
      status: "active",
    },
    "organization_id,user_id",
  );

  const customer =
    (await findOne("customers", {
      organization_id: organization.id,
      user_id: customerUserId,
    })) ??
    (
      await request("/rest/v1/customers", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          organization_id: organization.id,
          user_id: customerUserId,
          name: "Stage 3 Customer",
          email: "customer@fieldops.test",
          phone: "+91 90000 30003",
          address_line1: "42 Operations Avenue",
          city: "Chennai",
          state: "Tamil Nadu",
          postal_code: "600001",
          country: "India",
          site_reference: "CHN-OPS-01",
        }),
      })
    )[0];

  const site =
    (await findOne("sites", {
      organization_id: organization.id,
      customer_id: customer.id,
      name: "Chennai Service Site",
    })) ??
    (
      await request("/rest/v1/sites", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          organization_id: organization.id,
          customer_id: customer.id,
          name: "Chennai Service Site",
          address_line1: "42 Operations Avenue",
          city: "Chennai",
          state: "Tamil Nadu",
          postal_code: "600001",
          country: "India",
        }),
      })
    )[0];

  const requests = await Promise.all([
    ensureRequest(
      organization.id,
      customer.id,
      site.id,
      "HVAC unit not cooling",
      "Customer reports that the main office HVAC is running but not cooling the work area.",
      "urgent",
    ),
    ensureRequest(
      organization.id,
      customer.id,
      site.id,
      "Electrical inspection required",
      "Inspect intermittent power loss reported on the second-floor workstations.",
      "normal",
    ),
    ensureRequest(
      organization.id,
      customer.id,
      site.id,
      "Preventive maintenance visit",
      "Perform a routine inspection of the backup generator and service panel.",
      "low",
    ),
  ]);

  console.log("");
  console.log("Stage 3 fixture is ready.");
  console.log(`Organization: ${organization.name} (${organization.id})`);
  console.log(`Requests: ${requests.map((item) => item.id).join(", ")}`);
  console.log("");
  console.log("Test accounts:");
  console.log("  Dispatcher  dispatcher@fieldops.test");
  console.log("  Technician  technician@fieldops.test");
  console.log("  Customer    customer@fieldops.test");
  console.log("  Password    value of STAGE3_TEST_PASSWORD");
  console.log("");
  console.log("Flow:");
  console.log("  1. Sign in as customer and confirm the seeded requests are visible.");
  console.log("  2. Sign in as dispatcher and open /dispatch.");
  console.log("  3. Create a job from 'HVAC unit not cooling'.");
  console.log("  4. Open the job and assign 'Stage 3 Technician'.");
  console.log("  5. Confirm the request becomes scheduled and the job becomes assigned.");
  console.log("  6. Unassign and reassign once to verify assignment history.");
  console.log("  7. Keep the assigned job for Stage 4 technician execution.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
