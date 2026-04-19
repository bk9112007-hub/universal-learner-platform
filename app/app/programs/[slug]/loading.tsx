export default function ProgramDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">Loading program</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Preparing your protected learning space...</h1>
        <p className="mt-3 text-slate-600">We&apos;re loading modules, resources, and progress from Supabase.</p>
      </div>
    </div>
  );
}
