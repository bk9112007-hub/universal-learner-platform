import Link from "next/link";

import { ProjectCatalogNav } from "@/components/admin/project-catalog-nav";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, MetricCard } from "@/components/dashboard/dashboard-primitives";
import { assertRole } from "@/lib/auth/roles";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { getProjectCatalogSummary } from "@/lib/project-catalog/queries";

export default async function ProjectCatalogDashboardPage() {
  const { profile } = await getProfileForCurrentUser();
  assertRole(["teacher", "admin"], profile?.role ?? null);

  const summary = await getProjectCatalogSummary(profile!.role);

  return (
    <AppShell
      role={profile!.role}
      title="Project catalog"
      description="Phase 1 of the catalog engine gives staff a real place to curate hooks, roles, scenarios, activities, and outputs before the full formulator is layered on."
    >
      <DashboardSection
        title="Catalog categories"
        description="Each category stores fully fleshed building blocks that will feed the later project formulation engine."
      >
        <ProjectCatalogNav />
        <div className="mt-6 grid gap-4 xl:grid-cols-5">
          {summary.map((entry) => (
            <Link key={entry.type} href={entry.href} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">{entry.title}</p>
              <p className="mt-3 text-3xl font-semibold text-ink">{entry.totalCount}</p>
              <p className="mt-2 text-sm text-slate-600">{entry.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1">{entry.approvedCount} approved</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">{entry.draftCount} draft</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">{entry.archivedCount} archived</span>
              </div>
            </Link>
          ))}
        </div>
      </DashboardSection>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Approved items" value={String(summary.reduce((sum, entry) => sum + entry.approvedCount, 0))} detail="Authenticated users can read approved catalog entries through RLS." />
        <MetricCard label="Draft items" value={String(summary.reduce((sum, entry) => sum + entry.draftCount, 0))} detail="Draft content stays staff-only until approved." />
        <MetricCard label="Access" value={profile!.role === "admin" ? "Admin" : "Staff"} detail="Teachers and admins can manage catalog entries in Phase 1." />
      </section>
    </AppShell>
  );
}
