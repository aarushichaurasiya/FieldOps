import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

const statusLabel: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  awaiting_signoff: "Awaiting sign-off",
  signed_off: "Signed off",
  invoiced: "Invoiced",
};

export default async function TechnicianPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,status")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("organization_id,role,status")
    .eq("user_id", user.id)
    .eq("status", "active");

  const isTechnician = memberships?.some((membership) => membership.role === "technician");
  if (!isTechnician) redirect("/dashboard");

  const { data: assignments } = await supabase
    .from("assignments")
    .select("job_id,assigned_at")
    .eq("technician_id", user.id)
    .is("unassigned_at", null)
    .order("assigned_at", { ascending: false });

  const jobIds = assignments?.map((assignment) => assignment.job_id) ?? [];

  const { data: jobs } = jobIds.length
    ? await supabase
        .from("jobs")
        .select("id,status,scheduled_start,scheduled_end,request_id")
        .in("id", jobIds)
        .order("updated_at", { ascending: false })
    : { data: [] as Array<{ id: string; status: string; scheduled_start: string | null; scheduled_end: string | null; request_id: string }> };

  const requestIds = jobs?.map((job) => job.request_id) ?? [];
  const { data: requests } = requestIds.length
    ? await supabase
        .from("service_requests")
        .select("id,title,description,priority,site_id")
        .in("id", requestIds)
    : { data: [] };

  const siteIds = requests?.map((request) => request.site_id).filter(Boolean) ?? [];
  const { data: sites } = siteIds.length
    ? await supabase.from("sites").select("id,name,city,state,address_line1").in("id", siteIds)
    : { data: [] };

  const requestById = new Map((requests ?? []).map((request) => [request.id, request]));
  const siteById = new Map((sites ?? []).map((site) => [site.id, site]));

  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-6 py-10 text-[var(--color-ink)]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">FieldOps</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Technician workspace</h1>
            <p className="mt-2 text-slate-600">Your active field jobs, schedule, and execution queue.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-blue)]">Dashboard</Link>
            <form action={logout}><button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-blue)]">Sign out</button></form>
          </div>
        </div>

        <section className="mt-8 rounded-3xl bg-[var(--color-blue)] p-7 text-white shadow-xl shadow-indigo-950/10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Field technician</p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold">{profile?.full_name ?? "Technician"}</h2>
              <p className="mt-1 text-sm text-slate-300">{user.email}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 text-sm">
              <span className="text-slate-300">Active jobs</span>
              <span className="ml-2 font-semibold text-white">{jobs?.length ?? 0}</span>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700">My queue</p>
              <h2 className="mt-1 text-2xl font-semibold">Assigned jobs</h2>
            </div>
          </div>

          {jobs?.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {jobs.map((job) => {
                const request = requestById.get(job.request_id);
                const site = request?.site_id ? siteById.get(request.site_id) : null;
                return (
                  <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Job</p>
                        <h3 className="mt-2 text-xl font-semibold">{request?.title ?? "Service job"}</h3>
                      </div>
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{statusLabel[job.status] ?? job.status}</span>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
                      <div><p className="text-slate-500">Priority</p><p className="mt-1 font-semibold capitalize">{request?.priority ?? "—"}</p></div>
                      <div><p className="text-slate-500">Site</p><p className="mt-1 font-semibold">{site?.name ?? "—"}</p></div>
                    </div>

                    {request?.description ? <p className="mt-5 text-sm leading-6 text-slate-600">{request.description}</p> : null}

                    <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                      <span className="text-xs text-slate-500">Assigned {new Date(assignments?.find((assignment) => assignment.job_id === job.id)?.assigned_at ?? Date.now()).toLocaleString()}</span>
                      <Link href={`/technician/jobs/${job.id}`} className="rounded-xl bg-[var(--color-blue)] px-4 py-2.5 text-sm font-semibold text-white">Open job</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold">No active jobs</h3>
              <p className="mt-2 text-sm text-slate-500">Jobs assigned by dispatch will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
