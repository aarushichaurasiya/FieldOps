import { login, signup } from "../actions";

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-[var(--color-lilac)] px-6 py-16 text-[var(--color-ink)]">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">FieldOps</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Sign in or create an account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Authentication is provided by Supabase. Operational roles are assigned through organization membership.</p>
        {params.error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error}</p> : null}
        {params.message ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{params.message}</p> : null}
        <form className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(17,20,57,0.08)]">
          <label className="block text-sm"><span className="mb-2 block font-medium text-slate-700">Full name (for sign-up)</span><input name="full_name" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none ring-violet-400 focus:ring-2" /></label>
          <label className="block text-sm"><span className="mb-2 block font-medium text-slate-700">Email</span><input name="email" type="email" required className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none ring-violet-400 focus:ring-2" /></label>
          <label className="block text-sm"><span className="mb-2 block font-medium text-slate-700">Password</span><input name="password" type="password" minLength={8} required className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none ring-violet-400 focus:ring-2" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button formAction={login} className="rounded-xl bg-[var(--color-blue)] px-4 py-2.5 font-semibold text-white">Sign in</button>
            <button formAction={signup} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-[var(--color-blue)]">Create account</button>
          </div>
        </form>
      </div>
    </main>
  );
}
