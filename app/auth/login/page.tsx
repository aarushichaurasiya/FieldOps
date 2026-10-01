import { login, signup } from "../actions";

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">FieldOps</p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in or create an account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Authentication is provided by Supabase. Operational roles are assigned through organization membership.
        </p>
        {params.error ? <p className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{params.error}</p> : null}
        {params.message ? <p className="mt-6 rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">{params.message}</p> : null}
        <form className="mt-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <label className="block text-sm"><span className="mb-2 block text-slate-300">Full name (for sign-up)</span><input name="full_name" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-2 block text-slate-300">Email</span><input name="email" type="email" required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-2 block text-slate-300">Password</span><input name="password" type="password" minLength={8} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button formAction={login} className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Sign in</button>
            <button formAction={signup} className="rounded-lg border border-slate-700 px-4 py-2 font-semibold">Create account</button>
          </div>
        </form>
      </div>
    </main>
  );
}
