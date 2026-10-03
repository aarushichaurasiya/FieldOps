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
};

export default async function TechnicianJobPage({ params }: Props) {
  const { id } = await params;
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
    .select("id,status,scheduled_start,scheduled_end,created_at,updated_at,request_id")
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="font-semibold">Job details</h2>
              <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Priority</dt><dd className="mt-1 font-semibold capitalize">{request?.priority ?? "—"}</dd></div>
                <div><dt className="text-slate-500">Site</dt><dd className="mt-1 font-semibold">{site?.name ?? "No site selected"}</dd></div>
                <div><dt className="text-slate-500">Assigned</dt><dd className="mt-1">{new Date(assignment.assigned_at).toLocaleString()}</dd></div>
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
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Execution</p>
            <h2 className="mt-2 text-xl font-semibold">Technician actions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This workspace is scoped to your active assignment. Execution actions will update the job through protected PostgreSQL mutations.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-violet-50 p-4 text-sm text-violet-900">
                <strong>Assigned job</strong>
                <p className="mt-1 text-xs leading-5">You are the active technician for this job.</p>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                Start-work, work logs, parts, photos, and completion actions will appear here as the execution workflow is enabled.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
