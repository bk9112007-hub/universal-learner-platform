import { dashboardActivityByRole, dashboardCardsByRole } from "@/lib/content/site-content";
import type { UserRole } from "@/types/domain";

export function DashboardOverview({ role }: { role: UserRole }) {
  const cards = dashboardCardsByRole[role];
  const activity = dashboardActivityByRole[role];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{card.value}</p>
            <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Operational Snapshot</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-mist p-5">
              <p className="text-sm text-slate-500">Prototype workflows preserved</p>
              <p className="mt-2 text-lg font-semibold text-ink">Projects, assessments, feedback, collaboration, and profile views remain first-class.</p>
            </div>
            <div className="rounded-3xl bg-brand-50 p-5">
              <p className="text-sm text-brand-700">Production upgrade</p>
              <p className="mt-2 text-lg font-semibold text-brand-900">Local state becomes Supabase-backed data with auth, storage, and permissions.</p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Recent Activity</h2>
          <div className="mt-5 space-y-4">
            {activity.map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.timestamp}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
