import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCustomerInvoice } from "@/lib/billing";
import { getCustomerRequest } from "@/lib/requests";
import { PrintButton } from "@/components/print-button";

function money(cents: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(cents / 100); }

export default async function CustomerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getCustomerRequest(id);
  if (!request) notFound();
  const result = await getCustomerInvoice(id);
  if (!result) redirect(`/requests/${id}`);
  const { invoice, lines } = result;

  return <main className="min-h-screen bg-[var(--color-lilac)] px-5 py-8 text-[var(--color-ink)] sm:px-8"><div className="mx-auto max-w-4xl"><div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden"><Link href={`/requests/${id}`} className="text-sm font-semibold text-[var(--color-blue)]">← Request detail</Link><PrintButton /></div><article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none"><header className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200 pb-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">FieldOps invoice</p><h1 className="mt-2 text-4xl font-semibold">{invoice.number}</h1><p className="mt-2 text-sm text-slate-500">{request.title}</p></div><span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold capitalize text-emerald-800">{invoice.status}</span></header><div className="mt-7 grid gap-5 sm:grid-cols-2"><div><p className="text-xs text-slate-500">Customer</p><p className="mt-1 font-semibold">Your FieldOps account</p></div><div><p className="text-xs text-slate-500">Issued</p><p className="mt-1 font-semibold">{invoice.issued_at ? new Date(invoice.issued_at).toLocaleString() : "—"}</p></div></div><div className="mt-8 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Description</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Unit</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{lines.map((line) => <tr key={line.id}><td className="px-4 py-3">{line.description}</td><td className="px-4 py-3 text-right">{line.quantity}</td><td className="px-4 py-3 text-right">{money(line.unit_price_cents)}</td><td className="px-4 py-3 text-right font-semibold">{money(line.line_total_cents ?? line.quantity * line.unit_price_cents)}</td></tr>)}</tbody></table></div><div className="mt-6 ml-auto max-w-sm space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(invoice.subtotal_cents)}</span></div><div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{money(invoice.tax_cents)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{money(invoice.total_cents)}</span></div></div></article></div></main>;
}
