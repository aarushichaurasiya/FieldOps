import Link from "next/link";
import { redirect } from "next/navigation";
import { createRequest, provisionWorkspace } from "../actions";
import { getCurrentCustomer, listCustomerSites } from "@/lib/requests";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewRequestPage({ searchParams }: Props) {
  const params = await searchParams;
  const { user, customer } = await getCurrentCustomer();
  if (!user) redirect("/auth/login");

  const sites = customer ? await listCustomerSites() : [];

  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-5 py-10 text-[var(--color-ink)] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/requests" className="text-sm font-semibold text-[var(--color-blue)]">← Service requests</Link>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Request intake</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Tell us what needs attention.</h1>
          <p className="mt-3 text-slate-600">This form writes directly to the protected <code>service_requests</code> table through the authenticated Supabase session.</p>
        </div>

        {params.error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</p> : null}

        {!customer ? (
          <section className="mt-8 rounded-3xl border border-violet-200 bg-white p-7 shadow-sm">
            <h2 className="font-semibold">Customer workspace not provisioned</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Authentication is working, but this account does not have a customer workspace yet. The setup below creates only your own organization, customer record, and membership—no placeholder data.
            </p>
            <form action={provisionWorkspace} className="mt-5">
              <button className="rounded-xl bg-[var(--color-blue)] px-4 py-2.5 text-sm font-semibold text-white">Set up my customer workspace</button>
            </form>
            <Link href="/dashboard" className="mt-3 inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[var(--color-blue)]">Back to dashboard</Link>
          </section>
        ) : (
          <form action={createRequest} className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(17,20,57,0.08)]">
            <label className="block text-sm font-medium">
              <span className="mb-2 block">Issue title</span>
              <input name="title" required minLength={3} maxLength={120} placeholder="e.g. Air conditioner not cooling" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-violet-400 transition focus:ring-2" />
            </label>

            <label className="block text-sm font-medium">
              <span className="mb-2 block">Site</span>
              <select name="site_id" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-violet-400 transition focus:ring-2">
                <option value="">No site selected</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}{site.city ? ` — ${site.city}` : ""}</option>
                ))}
              </select>
            </label>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                <span className="mb-2 block">Priority</span>
                <select name="priority" defaultValue="normal" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-violet-400 transition focus:ring-2">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <div className="rounded-xl bg-violet-50 p-4 text-xs leading-5 text-slate-600">
                <strong className="text-[var(--color-blue)]">What happens next?</strong><br />
                The request starts as <strong>submitted</strong>. Dispatcher workflow will be added in Stage 3.
              </div>
            </div>

            <label className="block text-sm font-medium">
              <span className="mb-2 block">Description</span>
              <textarea name="description" rows={6} maxLength={2000} placeholder="Describe the problem, symptoms, equipment, or anything the field team should know." className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-violet-400 transition focus:ring-2" />
            </label>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <Link href="/requests" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[var(--color-blue)]">Cancel</Link>
              <button className="rounded-xl bg-[var(--color-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">Submit request</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
