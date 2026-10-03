import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDispatchJob, listAvailableTechnicians } from "@/lib/dispatch";
import { getServiceReport } from "@/lib/billing";
import { createInvoiceAction, issueInvoiceAction, markInvoicePaidAction, unassignJobAction } from "../../actions";

const statusStyles: Record<string, string> = {
  requested: "bg-violet-100 text-violet-800",
  assigned: "bg-emerald-100 text-emerald-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-slate-200 text-slate-700",
  awaiting_signoff: "bg-cyan-100 text-cyan-800",
  signed_off: "bg-blue-100 text-blue-800",
  invoiced: "bg-indigo-100 text-indigo-800",
  cancelled: "bg-red-100 text-red-800",
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

function money(cents: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(cents / 100);
}

export default async function DispatchJobPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const result = await getDispatchJob(id);
  if (!result.authorized) redirect("/dashboard?error=dispatcher_required");
  if (!result.job) notFound();

  const { technicians } = await listAvailableTechnicians();
  const report = await getServiceReport(id);
  const job = result.job;
  const request = job.service_requests;
  const activeAssignment = result.assignments.find((assignment) => !assignment.unassigned_at);
  const invoice = report?.invoice ?? null;

  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-5 py-8 text-[var(--color-ink)] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/dispatch" className="text-sm font-semibold text-[var(--color-blue)]">← Operations queue</Link>
        <header className="mt-6 flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Job workspace</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">{request?.title ?? "Service job"}</h1><p className="mt-2 text-sm text-slate-500">Job ID {job.id}</p></div>
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyles[job.status] ?? "bg-slate-100 text-slate-700"}`}>{job.status.replaceAll("_", " ")}</span>
        </header>

        {query.error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{query.error}</p> : null}
        {query.saved === "assigned" ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Technician assignment saved.</p> : null}
        {query.saved === "unassigned" ? <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Technician assignment removed. The job is back in the unassigned queue.</p> : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="font-semibold">Request context</h2>
              <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Customer</dt><dd className="mt-1 font-semibold">{request?.customers?.name ?? "—"}</dd></div>
                <div><dt className="text-slate-500">Contact</dt><dd className="mt-1">{request?.customers?.email ?? request?.customers?.phone ?? "—"}</dd></div>
                <div><dt className="text-slate-500">Site</dt><dd className="mt-1 font-semibold">{request?.sites?.name ?? "No site selected"}</dd></div>
                <div><dt className="text-slate-500">Priority</dt><dd className="mt-1 font-semibold capitalize">{request?.priority ?? "—"}</dd></div>
              </dl>
              <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-sm text-slate-500">Description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{request?.description || "No description provided."}</p></div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Assignment history</h2><p className="mt-1 text-xs text-slate-500">Assignment records are append-only except for their close timestamp.</p></div>{activeAssignment ? <form action={unassignJobAction}><input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="assignment_id" value={activeAssignment.id} /><button type="submit" className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Unassign</button></form> : null}</div>
              <div className="mt-5 space-y-3">{result.assignments.length ? result.assignments.map((assignment) => <div key={assignment.id} className="rounded-2xl bg-[var(--color-lilac)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{assignment.technician?.full_name || "Technician"}</p><p className="mt-1 text-xs text-slate-500">Assigned {new Date(assignment.assigned_at).toLocaleString()}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${assignment.unassigned_at ? "bg-white text-slate-500" : "bg-emerald-100 text-emerald-800"}`}>{assignment.unassigned_at ? "closed" : "active"}</span></div>{assignment.unassigned_at ? <p className="mt-2 text-xs text-slate-500">Unassigned {new Date(assignment.unassigned_at).toLocaleString()}</p> : null}</div>) : <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No assignment history yet.</p>}</div>
            </section>

            {job.status === "signed_off" || job.status === "invoiced" ? (
              <section className="rounded-3xl border border-blue-200 bg-white p-7 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Billing</p><h2 className="mt-2 text-2xl font-semibold">Invoice & service report</h2><p className="mt-2 text-sm text-slate-500">Customer sign-off is complete. Generate, issue, and track the service invoice.</p></div>{invoice ? <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800">{invoice.status}</span> : null}</div>
                {!invoice ? (
                  <form action={createInvoiceAction} className="mt-6 grid gap-4 sm:grid-cols-3">
                    <input type="hidden" name="job_id" value={job.id} />
                    <label className="text-sm font-medium"><span className="mb-2 block">Labor / service charge (₹)</span><input name="labor_charge" type="number" min="0" step="0.01" defaultValue="0" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
                    <label className="text-sm font-medium"><span className="mb-2 block">Tax rate (%)</span><input name="tax_rate" type="number" min="0" max="100" step="0.01" defaultValue="0" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
                    <div className="flex items-end"><button type="submit" className="w-full rounded-xl bg-[var(--color-blue)] px-4 py-3 text-sm font-semibold text-white">Generate draft invoice</button></div>
                  </form>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Invoice</p><p className="mt-1 font-semibold">{invoice.number}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Subtotal</p><p className="mt-1 font-semibold">{money(invoice.subtotal_cents)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Tax</p><p className="mt-1 font-semibold">{money(invoice.tax_cents)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Total</p><p className="mt-1 font-semibold">{money(invoice.total_cents)}</p></div></div>
                    <div className="flex flex-wrap gap-3"><Link href={`/dispatch/invoices/${invoice.id}`} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold">Open invoice</Link><Link href={`/dispatch/jobs/${job.id}/report`} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold">Service report</Link>{invoice.status === "draft" ? <form action={issueInvoiceAction}><input type="hidden" name="invoice_id" value={invoice.id} /><input type="hidden" name="job_id" value={job.id} /><button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Issue invoice</button></form> : null}{invoice.status === "issued" ? <form action={markInvoicePaidAction}><input type="hidden" name="invoice_id" value={invoice.id} /><input type="hidden" name="job_id" value={job.id} /><button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Mark paid</button></form> : null}</div>
                  </div>
                )}
              </section>
            ) : null}
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Dispatcher action</p>
            <h2 className="mt-2 text-xl font-semibold">{activeAssignment ? "Reassign technician" : "Assign technician"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Only active technician memberships in this organization can be selected.</p>
            {job.status === "requested" || job.status === "assigned" ? (technicians.length ? <form method="post" action="/api/dispatch/jobs/assign" className="mt-6 space-y-4"><input type="hidden" name="job_id" value={job.id} /><label className="block text-sm font-medium"><span className="mb-2 block">Technician</span><select name="technician_id" required className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="">Choose technician</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.full_name || "Unnamed technician"} · {technician.activeJobCount} active</option>)}</select></label><button type="submit" aria-label="Assign selected technician" className="w-full cursor-pointer rounded-xl bg-[var(--color-blue)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">{activeAssignment ? "Save reassignment" : "Assign technician"}</button></form> : <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">No active technicians are available.</div>) : <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-600">Assignment changes are locked while the job is <strong>{job.status.replaceAll("_", " ")}</strong>.</div>}
            <div className="mt-6 rounded-2xl bg-violet-50 p-4 text-xs leading-5 text-violet-900"><strong>Stage 4:</strong> invoice mutations run through protected PostgreSQL functions and append audit events.</div>
          </aside>
        </div>
      </div>
    </main>
  );
}
