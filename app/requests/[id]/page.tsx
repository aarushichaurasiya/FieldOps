import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateRequest } from "../actions";
import { getCustomerRequest } from "@/lib/requests";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function RequestDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const request = await getCustomerRequest(id);

  if (!request) {
    const { user } = await getCustomerRequest(id).then(() => ({ user: null })).catch(() => ({ user: null }));
    if (!user) redirect("/auth/login");
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-5 py-10 text-[var(--color-ink)] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/requests" className="text-sm font-semibold text-[var(--color-blue)]">← Service requests</Link>
        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Request detail</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{request.title}</h1>
            <p className="mt-2 text-sm text-slate-500">Created {new Date(request.created_at).toLocaleString()}</p>
          </div>
          <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800">{request.status.replace("_", " ")}</span>
        </div>

        {query.error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{query.error}</p> : null}
        {query.saved ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Request updated.</p> : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="font-semibold">Request information</h2>
            <dl className="mt-5 space-y-5 text-sm">
              <div><dt className="text-slate-500">Description</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{request.description || "No description provided."}</dd></div>
              <div><dt className="text-slate-500">Priority</dt><dd className="mt-1 font-semibold capitalize">{request.priority}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-semibold capitalize">{request.status.replace("_", " ")}</dd></div>
            </dl>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="font-semibold">Edit request</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">Customers can edit request details before dispatch workflow takes over. Status and ownership remain server-controlled.</p>
            <form action={updateRequest} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={request.id} />
              <label className="block text-sm font-medium"><span className="mb-2 block">Title</span><input name="title" defaultValue={request.title} required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-violet-400 focus:ring-2" /></label>
              <label className="block text-sm font-medium"><span className="mb-2 block">Priority</span><select name="priority" defaultValue={request.priority} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-violet-400 focus:ring-2"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              <label className="block text-sm font-medium"><span className="mb-2 block">Description</span><textarea name="description" defaultValue={request.description ?? ""} rows={5} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-violet-400 focus:ring-2" /></label>
              <button className="w-full rounded-xl bg-[var(--color-blue)] px-4 py-2.5 text-sm font-semibold text-white">Save changes</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
