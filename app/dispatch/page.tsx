import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { getDispatcherContext, listAvailableTechnicians, listDispatchQueue } from "@/lib/dispatch";
import { dispatchFilterSchema } from "@/lib/validation/dispatch";
import { createJobAction } from "./actions";

const statusStyles: Record<string, string> = {
  submitted: "bg-violet-100 text-violet-800",
  accepted: "bg-blue-100 text-blue-800",
  scheduled: "bg-cyan-100 text-cyan-800",
  assigned: "bg-emerald-100 text-emerald-800",
  in_progress: "bg-amber-100 text-amber-800",
};

const priorityStyles: Record<string, string> = {
  low: "text-slate-500",
  normal: "text-slate-700",
  high: "text-orange-700",
  urgent: "text-red-700",
};

type Props = {
  searchParams: Promise<{ status?: string; priority?: string; search?: string; error?: string }>;
};

export default async function DispatchPage({ searchParams }: Props) {
  const params = await searchParams;
  const context = await getDispatcherContext();

  if (!context) redirect("/dashboard?error=dispatcher_required");

  const filters = dispatchFilterSchema.parse({
    status: params.status ?? "all",
    priority: params.priority ?? "all",
    search: params.search ?? "",
  });

  const [queue, technicianResult] = await Promise.all([
    listDispatchQueue(filters),
    listAvailableTechnicians(),
  ]);

  const items = queue.items;
  const technicians = technicianResult.technicians;

  const unassigned = items.filter((item) => item.job && !item.assignment).length;
  const awaitingJob = items.filter((item) => !item.job).length;
  const assigned = items.filter((item) => Boolean(item.assignment)).length;

  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-5 py-8 text-[var(--color-ink)] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-[var(--color-blue)]">← Dashboard</Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Stage 3 · Dispatcher</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Operations queue</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Turn real customer requests into jobs, then assign them to active technicians. Every mutation is authorized and audited in PostgreSQL.</p>
          </div>
          <form action={logout}><button type="submit" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-blue)]">Sign out</button></form>
        </header>

        {params.error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</p> : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Awaiting job", awaitingJob, "Requests ready to be accepted"],
            ["Unassigned jobs", unassigned, "Jobs needing a technician"],
            ["Assigned", assigned, "Jobs currently owned by a technician"],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
            <input name="search" defaultValue={filters.search} placeholder="Search request title" className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400" />
            <select name="status" defaultValue={filters.status} className="rounded-xl border border-slate-300 px-3 py-2.5">
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="accepted">Accepted</option>
              <option value="scheduled">Scheduled</option>
              <option value="assigned">Assigned</option>
            </select>
            <select name="priority" defaultValue={filters.priority} className="rounded-xl border border-slate-300 px-3 py-2.5">
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <button type="submit" className="rounded-xl bg-[var(--color-blue)] px-5 py-2.5 text-sm font-semibold text-white">Filter</button>
          </form>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Request queue</h2>
                  <p className="mt-1 text-xs text-slate-500">{items.length} visible operational request{items.length === 1 ? "" : "s"}</p>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800">{context.role}</span>
              </div>
            </div>

            {items.length ? (
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <article key={item.request.id} className="px-6 py-5 transition hover:bg-violet-50/40">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{item.request.title}</h3>
                          <span className={`text-xs font-semibold uppercase ${priorityStyles[item.request.priority] ?? "text-slate-600"}`}>{item.request.priority}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{item.request.description || "No description provided."}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>Customer: {item.request.customers?.name ?? "—"}</span>
                          <span>Site: {item.request.sites?.name ?? "No site"}</span>
                          <span>{new Date(item.request.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.job?.status ?? item.request.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {(item.job?.status ?? item.request.status).replaceAll("_", " ")}
                        </span>
                        {item.job ? (
                          <Link href={`/dispatch/jobs/${item.job.id}`} className="text-sm font-semibold text-[var(--color-blue)] hover:underline">Open job →</Link>
                        ) : (
                          <form action={createJobAction} className="relative z-10">
                            <input type="hidden" name="request_id" value={item.request.id} />
                            <button
                              type="submit"
                              className="relative z-10 cursor-pointer rounded-xl bg-[var(--color-blue)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                            >
                              Create job
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    {item.assignment && item.technician ? (
                      <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        Assigned to <strong>{item.technician.full_name || "Technician"}</strong>.
                      </div>
                    ) : item.job ? (
                      <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Job created and waiting for technician assignment.
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <h2 className="text-lg font-semibold">No requests match the current filters</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">The queue is backed by your authorized Supabase records; it does not use seeded or mock requests.</p>
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Technician pool</p>
            <h2 className="mt-2 text-xl font-semibold">Available team</h2>
            <p className="mt-1 text-sm text-slate-500">Active technician memberships visible to this dispatcher.</p>
            <div className="mt-5 space-y-3">
              {technicians.length ? technicians.map((technician) => (
                <div key={technician.id} className="rounded-2xl bg-[var(--color-lilac)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{technician.full_name || "Unnamed technician"}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{technician.activeJobCount} active</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{technician.phone || "No phone on profile"}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No active technician memberships are available yet.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
