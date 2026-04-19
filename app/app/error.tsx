"use client";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-rose-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">Dashboard error</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">We could not load this workspace.</h1>
        <p className="mt-3 text-slate-600">{error.message || "Please verify your Supabase setup and try again."}</p>
        <button type="button" onClick={reset} className="mt-6 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Try again
        </button>
      </div>
    </div>
  );
}
