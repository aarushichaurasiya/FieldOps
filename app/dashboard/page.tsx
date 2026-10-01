import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,status").eq("id", user.id).maybeSingle();
  const { data: memberships } = await supabase.from("organization_memberships").select("organization_id,role,status").eq("user_id", user.id).eq("status", "active");

  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-6 py-12 text-[var(--color-ink)]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">FieldOps</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Authenticated workspace</h1>
            <p className="mt-2 text-slate-600">Supabase Auth identity and Stage 1 profile/RLS access are active.</p>
          </div>
          <form action={logout}><button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-blue)]">Sign out</button></form>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="font-semibold">Identity</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="text-slate-500">Email</dt><dd className="mt-1 font-medium">{user.email ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Name</dt><dd className="mt-1 font-medium">{profile?.full_name ?? "Not set"}</dd></div>
              <div><dt className="text-slate-500">Profile status</dt><dd className="mt-1 font-medium">{profile?.status ?? "Unavailable"}</dd></div>
            </dl>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="font-semibold">Organization access</h2>
            {memberships?.length ? (
              <ul className="mt-4 space-y-3 text-sm">
                {memberships.map((membership) => (
                  <li key={membership.organization_id} className="rounded-xl bg-[var(--color-lilac)] p-3">
                    <span className="font-medium capitalize">{membership.role}</span>
                    <span className="ml-2 text-slate-500">{membership.organization_id}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-slate-500">No active organization membership yet. Customer/dispatcher provisioning is handled as part of the workflow stages.</p>}
          </section>
        </div>

        {memberships?.some((membership) => membership.role === "dispatcher" || membership.role === "admin") ? (
          <section className="mt-6 rounded-3xl border border-violet-100 bg-white p-7 shadow-sm">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700">Stage 3</p>
                <h2 className="mt-2 text-2xl font-semibold">Dispatcher operations</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review incoming requests, create operational jobs, and assign active technicians through the protected dispatch workflow.</p>
              </div>
              <Link href="/dispatch" className="shrink-0 rounded-xl bg-[var(--color-blue)] px-4 py-2.5 text-sm font-semibold text-white">Open dispatch</Link>
            </div>
          </section>
        ) : null}

        <section className="gradient-surface mt-6 rounded-3xl p-7 text-white shadow-xl shadow-indigo-950/10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Stage 2</p>
              <h2 className="mt-2 text-2xl font-semibold">Customer request intake</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Create and track real service requests using the authenticated Supabase session and existing RLS policies.</p>
            </div>
            <Link href="/requests" className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-blue)]">Open requests</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
