import { notFound } from "next/navigation";

import { ProjectCatalogArchiveForm } from "@/components/admin/project-catalog-archive-form";
import { ProjectCatalogItemForm } from "@/components/admin/project-catalog-item-form";
import { ProjectCatalogNav } from "@/components/admin/project-catalog-nav";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState } from "@/components/dashboard/dashboard-primitives";
import { assertRole } from "@/lib/auth/roles";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { getProjectCatalogDefinition, isProjectCatalogType } from "@/lib/project-catalog/catalog";
import { getProjectCatalogItems } from "@/lib/project-catalog/queries";

export default async function ProjectCatalogTypePage({
  params
}: {
  params: Promise<{ catalogType: string }>;
}) {
  const { profile } = await getProfileForCurrentUser();
  assertRole(["teacher", "admin"], profile?.role ?? null);

  const { catalogType } = await params;
  if (!isProjectCatalogType(catalogType)) {
    notFound();
  }

  const definition = getProjectCatalogDefinition(catalogType);
  const items = await getProjectCatalogItems(catalogType);

  return (
    <AppShell
      role={profile!.role}
      title={`${definition.title} catalog`}
      description={definition.description}
    >
      <DashboardSection
        title={`Manage ${definition.title.toLowerCase()}`}
        description={`Create, edit, and archive ${definition.title.toLowerCase()} without leaving the authenticated workspace.`}
      >
        <ProjectCatalogNav activeType={catalogType} />
      </DashboardSection>

      <DashboardSection
        title={`Create a ${definition.singular}`}
        description={`New ${definition.singular} entries should be fully usable building blocks, not thin tags.`}
      >
        <ProjectCatalogItemForm catalogType={catalogType} />
      </DashboardSection>

      <DashboardSection
        title={`Existing ${definition.title.toLowerCase()}`}
        description="All statuses are visible to staff here so draft work and archived entries stay manageable."
      >
        {items.length === 0 ? (
          <EmptyState
            title={`No ${definition.title.toLowerCase()} found`}
            description={`Create the first ${definition.singular} above to start building the catalog.`}
          />
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <article key={item.id} className="grid gap-6 rounded-[1.75rem] border border-slate-200 p-5 xl:grid-cols-[1fr,0.95fr]">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">{definition.singular}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-ink">{item.title}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-700">{item.summary}</p>
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{item.details}</p>
                </div>
                <div className="space-y-4 rounded-[1.5rem] bg-slate-50 p-4">
                  <ProjectCatalogItemForm catalogType={catalogType} item={item} />
                  <ProjectCatalogArchiveForm catalogType={catalogType} item={item} />
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>
    </AppShell>
  );
}
