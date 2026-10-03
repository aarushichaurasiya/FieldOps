import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const statusStyles: Record<string, string> = {
  assigned: "bg-violet-100 text-violet-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-slate-200 text-slate-700",
  awaiting_signoff: "bg-cyan-100 text-cyan-800",
  signed_off: "bg-blue-100 text-blue-800",
  invoiced: "bg-indigo-100 text-indigo-800",
  cancelled: "bg-red-100 text-red-800",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function TechnicianJobPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("organization_id,role,status")
    .eq("user_id", user.id)
    .eq("role", "technician")
    .eq("status", "active")
    .maybeSingle();

  if (!membership) redirect("/dashboard");

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id,assigned_at,job_id")
    .eq("job_id", id)
    .eq("technician_id", user.id)
    .is("unassigned_at", null)
    .maybeSingle();

  if (!assignment) notFound();

  const { data: job } = await supabase
    .from("jobs")
    .select("id,status,scheduled_start,scheduled_end,started_at,completed_at,completion_notes,created_at,updated_at,request_id")
    .eq("id", id)
    .maybeSingle();

  if (!job) notFound();

  const { data: request } = await supabase
    .from("service_requests")
    .select("id,title,description,priority,created_at,site_id")
    .eq("id", job.request_id)
    .maybeSingle();

  const { data: site } = request?.site_id
    ? await supabase
        .from("sites")
        .select("id,name,address_line1,city,state")
        .eq("id", request.site_id)
        .maybeSingle()
    : { data: null };

  const { data: workLogs } = await supabase
    .from("work_logs")
    .select("id,note,started_at,ended_at,created_at")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const { data: parts } = await supabase
    .from("part_usages")
    .select("id,part_name,quantity,unit_price_snapshot_cents,created_at")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const savedMessage =
    query.saved === "started" ? "Work started. Job moved to in progress." :
    query.saved === "work_log" ? "Work log added." :
    query.saved === "part" ? "Part usage added." :
    query.saved === "completed" ? "Job completed and sent for customer sign-off." : null;

  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-5 py-8 text-[var(--color-ink)] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/technician" className="text-sm font-semibold text-[var(--color-blue)]">← Technician queue</Link>

        <header className="mt-6 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Technician job</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{request?.title ?? "Service job"}</h1>
            <p className="mt-2 text-sm text-slate-500">Job ID {job.id}</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyles[job.status] ?? "bg-slate-100 text-slate-700"}`}>
            {job.status.replaceAll("_", " ")}
          </span>
        </header>

        {query.error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{query.error}</p> : null}
        {savedMessage ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{savedMessage}</p> : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="font-semibold">Job details</h2>
              <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Priority</dt><dd className="mt-1 font-semibold capitalize">{request?.priority ?? "—"}</dd></div>
                <div><dt className="text-slate-500">Site</dt><dd className="mt-1 font-semibold">{site?.name ?? "No site selected"}</dd></div>
                <div><dt className="text-slate-500">Assigned</dt><dd className="mt-1">{new Date(assignment.assigned_at).toLocaleString()}</dd></div>
                <div><dt className="text-slate-500">Started</dt><dd className="mt-1">{job.started_at ? new Date(job.started_at).toLocaleString() : "Not started"}</dd></div>
                <div><dt className="text-slate-500">Completed</dt><dd className="mt-1">{job.completed_at ? new Date(job.completed_at).toLocaleString() : "Not completed"}</dd></div>
                <div><dt className="text-slate-500">Schedule</dt><dd className="mt-1">{job.scheduled_start ? new Date(job.scheduled_start).toLocaleString() : "Not scheduled"}</dd></div>
              </dl>
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">Customer request</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{request?.description || "No description provided."}</p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="font-semibold">Service location</h2>
              <p className="mt-3 text-sm font-medium">{site?.name ?? "No site selected"}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {[site?.address_line1, site?.city, site?.state].filter(Boolean).join(", ") || "Address unavailable"}
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Work logs</h2>
                  <p className="mt-1 text-xs text-slate-500">Technician execution notes recorded against this job.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{workLogs?.length ?? 0}</span>
              </div>
              <div className="mt-5 space-y-3">
                {workLogs?.length ? workLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl bg-[var(--color-lilac)] p-4">
                    <p className="text-sm leading-6">{log.note || "Work performed without a note."}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {log.started_at ? new Date(log.started_at).toLocaleString() : new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                )) : (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No work logs yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Parts & materials</h2>
                  <p className="mt-1 text-xs text-slate-500">Usage is stored with a price snapshot for invoicing.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{parts?.length ?? 0}</span>
              </div>
              <div className="mt-5 space-y-3">
                {parts?.length ? parts.map((part) => (
                  <div key={part.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--color-lilac)] p-4">
                    <div>
                      <p className="font-semibold">{part.part_name}</p>
                      <p className="mt-1 text-xs text-slate-500">Quantity {part.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">₹{(part.unit_price_snapshot_cents / 100).toFixed(2)}</p>
                  </div>
                )) : (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No parts recorded yet.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Execution</p>
            <h2 className="mt-2 text-xl font-semibold">Technician actions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Every mutation is scoped to your active assignment and runs through protected PostgreSQL functions.</p>

            {job.status === "assigned" ? (
              <form method="post" action={`/api/technician/jobs/${job.id}/actions`} className="mt-6">
                <input type="hidden" name="action" value="start" />
                <button type="submit" className="w-full cursor-pointer rounded-xl bg-[var(--color-blue)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">Start work</button>
              </form>
            ) : null}

            {job.status === "in_progress" ? (
              <div className="mt-6 space-y-5">
                <form method="post" action={`/api/technician/jobs/${job.id}/actions`} className="space-y-3 rounded-2xl bg-slate-50 p-4">
                  <input type="hidden" name="action" value="work_log" />
                  <label className="block text-sm font-medium">
                    <span className="mb-2 block">Work note</span>
                    <textarea name="note" required rows={4} placeholder="Describe inspection, diagnosis, repair, or testing..." className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" />
                  </label>
                  <button type="submit" className="w-full cursor-pointer rounded-xl bg-[var(--color-blue)] px-4 py-3 text-sm font-semibold text-white">Add work log</button>
                </form>

                <form method="post" action={`/api/technician/jobs/${job.id}/actions`} className="space-y-3 rounded-2xl bg-slate-50 p-4">
                  <input type="hidden" name="action" value="part" />
                  <p className="text-sm font-semibold">Add part / material</p>
                  <input name="part_name" required placeholder="e.g. HVAC filter" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="quantity" type="number" min="1" step="1" required placeholder="Qty" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" />
                    <input name="unit_price" type="number" min="0" step="0.01" required placeholder="₹ Unit price" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm" />
                  </div>
                  <button type="submit" className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800">Add part</button>
                </form>

                <form method="post" action={`/api/technician/jobs/${job.id}/actions`} className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <input type="hidden" name="action" value="complete" />
                  <label className="block text-sm font-medium text-emerald-950">
                    <span className="mb-2 block">Completion notes</span>
                    <textarea name="completion_notes" required rows={4} placeholder="Summarize the repair and final test result..." className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-slate-900" />
                  </label>
                  <button type="submit" className="w-full cursor-pointer rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white">Complete job</button>
                </form>
              </div>
            ) : null}

            {job.status === "completed" ? (
              <div className="mt-6 rounded-2xl bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
                <strong>Work completed.</strong>
                <p className="mt-1">The job is ready for the customer sign-off stage.</p>
              </div>
            ) : null}

            {job.status !== "assigned" && job.status !== "in_progress" && job.status !== "completed" ? (
              <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-600">
                Execution actions are locked while the job is <strong>{job.status.replaceAll("_", " ")}</strong>.
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl bg-violet-50 p-4 text-xs leading-5 text-violet-900">
              <strong>Security:</strong> technician mutations verify the authenticated user, active technician membership, and active assignment before changing job data.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
