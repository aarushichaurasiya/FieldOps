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
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">FieldOps</p>
            <h1 className="mt-3 text-3xl font-semibold">Authenticated workspace</h1>
            <p className="mt-2 text-slate-400">Supabase Auth identity and Stage 1 profile/RLS access are active.</p>
          </div>
          <form action={logout}><button className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Sign out</button></form>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold">Identity</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-500">Email</dt><dd>{user.email ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Name</dt><dd>{profile?.full_name ?? "Not set"}</dd></div>
              <div><dt className="text-slate-500">Profile status</dt><dd>{profile?.status ?? "Unavailable"}</dd></div>
            </dl>
          </section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold">Organization access</h2>
            {memberships?.length ? (
              <ul className="mt-4 space-y-3 text-sm">
                {memberships.map((membership) => (
                  <li key={membership.organization_id} className="rounded-lg bg-slate-950 p-3">
                    <span className="font-medium">{membership.role}</span>
                    <span className="ml-2 text-slate-500">{membership.organization_id}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-slate-400">No active organization membership yet. Admin provisioning is added in later workflow stages.</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
