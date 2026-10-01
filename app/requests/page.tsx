import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { getCurrentCustomer, listCustomerRequests } from "@/lib/requests";

const statusStyles: Record<string, string> = {
  submitted: "bg-violet-100 text-violet-800",
  accepted: "bg-blue-100 text-blue-800",
  scheduled: "bg-cyan-100 text-cyan-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-700",
};

const priorityStyles: Record<string, string> = {
  low: "text-slate-500",
  normal: "text-slate-700",
  high: "text-orange-700",
  urgent: "text-red-700",
};

export default async function RequestsPage() {
  const { user, customer } = await getCurrentCustomer();
  if (!user) redirect("/auth/login");

  const requests = await listCustomerRequests();

  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-5 py-8 text-[var(--color-ink)] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-[var(--color-blue)]">← Dashboard</Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Customer workspace</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Service requests</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Track submitted work and request service from the same protected Supabase data layer.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/requests/new" className="rounded-xl bg-[var(--color-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">New request</Link>
            <form action={logout}><button className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-blue)]">Sign out</button></form>
          </div>
        </header>

        {!customer ? (
          <section className="mt-10 rounded-3xl border border-violet-200 bg-white p-8 shadow-sm">
            <div className="mb-4 h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400" />
            <h2 className="text-xl font-semibold">Customer provisioning required</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Your Supabase Auth account is valid, but it is not linked to a customer record yet. FieldOps intentionally does not create fake customer or organization data.
            </p>
          </section>
        ) : (
          <section className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(17,20,57,0.08)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="text-sm font-semibold text-[var(--color-blue)]">{customer.name}</p>
              <p className="mt-1 text-xs text-slate-500">{requests.length} request{requests.length === 1 ? "" : "s"}</p>
            </div>
            {requests.length ? (
              <div className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <Link key={request.id} href={`/requests/${request.id}`} className="block px-6 py-5 transition hover:bg-violet-50/60">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{request.title}</h2>
                        <p className={`mt-1 text-xs font-semibold uppercase tracking-wide ${priorityStyles[request.priority] ?? "text-slate-600"}`}>{request.priority} priority</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {request.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{request.description || "No description provided."}</p>
                    <p className="mt-3 text-xs text-slate-400">{new Date(request.created_at).toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <h2 className="text-lg font-semibold">No service requests yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Create the first real request and it will appear here subject to the customer RLS policy.</p>
                <Link href="/requests/new" className="mt-5 inline-flex rounded-xl bg-[var(--color-blue)] px-4 py-2.5 text-sm font-semibold text-white">Create request</Link>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
