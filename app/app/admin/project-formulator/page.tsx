import Link from "next/link";

import { ProjectFormulatorCreateForm } from "@/components/admin/project-formulator-create-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState, MetricCard } from "@/components/dashboard/dashboard-primitives";
import { assertRole } from "@/lib/auth/roles";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { getGeneratedProjects, getProjectFormulatorOptions } from "@/lib/project-formulator/queries";

export default async function ProjectFormulatorPage() {
  const { profile } = await getProfileForCurrentUser();
  assertRole(["teacher", "admin"], profile?.role ?? null);

  const [options, generatedProjects] = await Promise.all([getProjectFormulatorOptions(), getGeneratedProjects()]);

  return (
    <AppShell
      role={profile!.role}
      title="Project formulator"
      description="Phase 2 turns the catalog into a human-guided drafting workflow. Staff combine curated ingredients into editable project plans before anything is assigned."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Catalog hooks" value={String(options.hooks.length)} detail="Available project openings for formulation." />
        <MetricCard label="Draft projects" value={String(generatedProjects.filter((project) => project.approvalStatus === "draft").length)} detail="Editable drafts waiting for review or refinement." />
        <MetricCard label="Approved or assigned" value={String(generatedProjects.filter((project) => project.approvalStatus === "approved" || project.approvalStatus === "assigned").length)} detail="Projects ready to move toward real assignment later." />
      </section>

      <DashboardSection
        title="Create a generated project draft"
        description="Select the subject, target skill, learner context, and catalog ingredients. The system will assemble a complete human-editable draft with snapshots."
      >
        <ProjectFormulatorCreateForm options={options} />
      </DashboardSection>

      <DashboardSection
        title="Generated project drafts"
        description="Open any draft to edit the mission, steps, rubric, and reflection questions before approval or later assignment."
      >
        {generatedProjects.length === 0 ? (
          <EmptyState title="No generated projects yet" description="Create the first draft above to open the editable project workflow." />
        ) : (
          <div className="space-y-4">
            {generatedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/app/admin/project-formulator/${project.id}`}
                className="block rounded-[1.5rem] border border-slate-200 p-5 transition hover:border-brand-300 hover:shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">{project.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {project.subject} | {project.gradeBand} | {project.difficulty} | {project.duration}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">{project.summary}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{project.approvalStatus}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DashboardSection>
    </AppShell>
  );
}
