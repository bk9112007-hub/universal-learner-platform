export default function AppLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">Loading</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Fetching your workspace...</h1>
        <p className="mt-3 text-slate-600">Universal Learner is loading live dashboard data from Supabase.</p>
      </div>
    </div>
  );
}
