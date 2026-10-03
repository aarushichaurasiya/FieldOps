import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServiceReport } from "@/lib/billing";
import { issueInvoiceAction, markInvoicePaidAction } from "../../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

function money(cents: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(cents / 100);
}

export default async function InvoicePage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const { getUser } = await import("@/lib/supabase/server").then((m) => ({ getUser: m.createClient }));
  const supabase = await getUser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: invoice } = await supabase.from("invoices").select("id,job_id,number,status,subtotal_cents,tax_cents,total_cents,currency,issued_at,created_at").eq("id", id).maybeSingle();
  if (!invoice) notFound();
  const report = await getServiceReport(invoice.job_id);
  if (!report) notFound();

  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-5 py-8 text-[var(--color-ink)] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href={`/dispatch/jobs/${invoice.job_id}`} className="text-sm font-semibold text-[var(--color-blue)]">← Job workspace</Link>
        {query.error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{query.error}</p> : null}
        {query.saved ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Invoice {query.saved} successfully.</p> : null}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200 pb-6">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">FieldOps invoice</p><h1 className="mt-2 text-4xl font-semibold">{invoice.number}</h1><p className="mt-2 text-sm text-slate-500">Customer: {report.customer?.name ?? "—"}</p></div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold capitalize">{invoice.status}</span>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div><p className="text-xs uppercase tracking-wide text-slate-500">Service</p><p className="mt-1 font-semibold">{report.request.title}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-slate-500">Technician</p><p className="mt-1 font-semibold">{report.technician_name ?? "—"}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-slate-500">Site</p><p className="mt-1 font-semibold">{report.site?.name ?? "—"}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-slate-500">Issued</p><p className="mt-1 font-semibold">{invoice.issued_at ? new Date(invoice.issued_at).toLocaleString() : "Not issued"}</p></div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Description</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Unit</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{report.invoice_lines.map((line) => <tr key={line.id}><td className="px-4 py-3">{line.description}</td><td className="px-4 py-3 text-right">{line.quantity}</td><td className="px-4 py-3 text-right">{money(line.unit_price_cents)}</td><td className="px-4 py-3 text-right font-semibold">{money(line.line_total_cents ?? line.quantity * line.unit_price_cents)}</td></tr>)}</tbody></table>
          </div>

          <div className="mt-6 ml-auto max-w-sm space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(invoice.subtotal_cents)}</span></div><div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{money(invoice.tax_cents)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{money(invoice.total_cents)}</span></div></div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6 print:hidden"><Link href={`/dispatch/jobs/${invoice.job_id}/report`} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold">Service report</Link>{invoice.status === "draft" ? <form action={issueInvoiceAction}><input type="hidden" name="invoice_id" value={invoice.id} /><input type="hidden" name="job_id" value={invoice.job_id} /><button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Issue invoice</button></form> : null}{invoice.status === "issued" ? <form action={markInvoicePaidAction}><input type="hidden" name="invoice_id" value={invoice.id} /><input type="hidden" name="job_id" value={invoice.job_id} /><button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Mark paid</button></form> : null}<button onClick={() => window.print()} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold">Print / Save PDF</button></div>
        </section>
      </div>
    </main>
  );
}
