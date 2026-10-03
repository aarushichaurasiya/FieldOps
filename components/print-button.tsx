"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold">
      Print / Save PDF
    </button>
  );
}
