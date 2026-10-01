import Link from "next/link";

const stages = ["Foundation","Customer requests","Dispatch","Technician execution","Evidence","Sign-off","Billing & reporting"];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">FieldOps</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">Field-service operations, from request to signed-off work.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Stage 1 establishes Supabase Auth, PostgreSQL data integrity, organization roles, and RLS.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/auth/login" className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Sign in</Link>
          <Link href="/dashboard" className="rounded-lg border border-slate-700 px-4 py-2 font-semibold">Dashboard</Link>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, index) => <div key={stage} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"><span className="text-xs font-medium text-cyan-400">{String(index + 1).padStart(2, "0")}</span><p className="mt-2 font-medium">{stage}</p></div>)}
        </div>
        <div className="mt-10 flex items-center gap-3 text-sm text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-400" />Stage 1 database + authentication foundation</div>
      </section>
    </main>
  );
}
