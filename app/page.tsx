import Link from "next/link";

const stages = ["Foundation", "Customer requests", "Dispatch", "Technician execution", "Evidence", "Sign-off", "Billing & reporting"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-lilac)] text-[var(--color-ink)]">
      <section className="relative isolate mx-auto flex min-h-screen max-w-7xl flex-col justify-center overflow-hidden px-6 py-20 sm:px-10">
        <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 -z-10 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="max-w-4xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.24em] text-[var(--color-accent)]">FieldOps</p>
          <h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">
            Field-service operations,
            <span className="gradient-text block">from request to signed-off work.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
            A secure operations workspace built on Supabase Auth, PostgreSQL, and resource-scoped RLS.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/auth/login" className="rounded-xl bg-[var(--color-blue)] px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-950/10 transition hover:-translate-y-0.5">Sign in</Link>
            <Link href="/requests" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-[var(--color-blue)] transition hover:border-violet-300 hover:bg-violet-50">Customer requests</Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <div key={stage} className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur">
              <span className="text-xs font-bold text-[var(--color-accent)]">{String(index + 1).padStart(2, "0")}</span>
              <p className="mt-3 font-semibold">{stage}</p>
            </div>
          ))}
        </div>

        <div className="gradient-surface mt-8 overflow-hidden rounded-3xl p-7 text-white shadow-2xl shadow-indigo-950/10 sm:p-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Production foundation</p>
              <h2 className="mt-2 text-2xl font-semibold">Real auth. Real database. Real authorization.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Stage 2 adds the first customer business action without introducing placeholder records.</p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-200"><span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />Supabase + RLS active</span>
          </div>
        </div>
      </section>
    </main>
  );
}
