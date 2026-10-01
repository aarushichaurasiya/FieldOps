import Link from "next/link";

const stages = [
  ["01", "Foundation"],
  ["02", "Customer requests"],
  ["03", "Dispatch"],
  ["04", "Technician execution"],
  ["05", "Evidence"],
  ["06", "Sign-off"],
  ["07", "Billing & reporting"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--color-lilac)] text-[var(--color-ink)]">
      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-8 sm:px-10 sm:pt-10">
        <div className="pointer-events-none absolute -left-48 top-20 h-[34rem] w-[34rem] rounded-full bg-violet-300/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-48 top-0 h-[32rem] w-[32rem] rounded-full bg-cyan-300/30 blur-3xl" />

        <nav className="relative flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-ink)] text-sm font-black text-white">F</span>
            <span className="font-bold tracking-tight">FieldOps</span>
          </div>
          <Link href="/auth/login" className="rounded-xl bg-[var(--color-ink)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            Sign in
          </Link>
        </nav>

        <div className="relative mt-16 grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:mt-24">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-violet-200 bg-white/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-violet-700 shadow-sm backdrop-blur">
              Secure field-service platform
            </p>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-7xl">
              Field-service operations,
              <span className="gradient-text block">from request to signed-off work.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              A production-style operations workspace powered by Supabase Auth, PostgreSQL, and resource-scoped RLS.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/auth/login" className="rounded-xl bg-[var(--color-ink)] px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-950/15 transition hover:-translate-y-0.5">
                Get started
              </Link>
              <Link href="/requests" className="rounded-xl border border-slate-300 bg-white/85 px-5 py-3 font-semibold text-[var(--color-ink)] transition hover:border-violet-300 hover:bg-white">
                Customer requests
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span>✓ Supabase Auth</span>
              <span>✓ PostgreSQL</span>
              <span>✓ Row Level Security</span>
            </div>
          </div>

          <div className="gradient-surface relative min-h-[420px] overflow-hidden rounded-[2rem] p-6 text-white shadow-2xl shadow-violet-900/20 sm:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Operations flow</p>
              <div className="mt-8 space-y-3">
                {[
                  ["01", "Customer request", "Submitted securely"],
                  ["02", "Dispatch", "Assigned to technician"],
                  ["03", "Field execution", "Work + evidence recorded"],
                  ["04", "Sign-off", "Customer confirms work"],
                ].map(([number, title, description]) => (
                  <div key={number} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 text-xs font-bold text-cyan-200">{number}</span>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-0.5 text-sm text-slate-300">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map(([number, stage]) => (
            <div key={stage} className="group rounded-2xl border border-white/90 bg-white/75 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg">
              <span className="gradient-text text-xs font-black">{number}</span>
              <p className="mt-3 font-semibold">{stage}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-8 rounded-3xl border border-violet-100 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Production foundation</p>
              <h2 className="mt-2 text-2xl font-semibold">Real auth. Real database. Real authorization.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">The customer workflow uses the existing Supabase/RLS architecture—no mock records.</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              Supabase + RLS active
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
