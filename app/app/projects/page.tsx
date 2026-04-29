import Link from "next/link";

import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState, MetricCard, StatusBadge } from "@/components/dashboard/dashboard-primitives";
import { assertRole } from "@/lib/auth/roles";
import { getProfileForCurrentUser, getStudentProjects } from "@/lib/dashboard/queries";
import { getGeneratedAssignedProjectsForStudent } from "@/lib/project-formulator/queries";

export default async function StudentProjectsPage() {
  const { profile, user } = await getProfileForCurrentUser();
  assertRole(["student"], profile?.role ?? null);

  const [assignments, projects] = await Promise.all([
    getGeneratedAssignedProjectsForStudent(user!.id),
    getStudentProjects(user!.id)
  ]);

  const generatedProjectMap = new Map(assignments.map((assignment) => [assignment.projectId, assignment]));
  const launchedProjects = projects.filter((project) => generatedProjectMap.has(project.id));

  return (
    <AppShell
      role="student"
      title="Projects"
      description="Generated projects that have been assigned to you now launch directly into the real project workspace so milestones, files, reflections, and teacher feedback all stay in one place."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Assigned generated projects" value={String(assignments.length)} detail="Each approved generated project can launch into one real workspace per student." />
        <MetricCard label="Live workspaces" value={String(launchedProjects.length)} detail="These workspaces are connected to the existing project, submission, and feedback system." />
        <MetricCard label="Pending launch" value={String(assignments.filter((assignment) => !assignment.projectId).length)} detail="Assignments without a live workspace will appear here until they are launched." />
      </section>

      <DashboardSection
        title="Assigned generated projects"
        description="Open the launched workspace to work through steps, upload submissions, respond to feedback, and track progress."
      >
        {assignments.length === 0 ? (
          <EmptyState title="No generated projects assigned yet" description="Once a teacher or admin assigns an approved generated project, it will appear here automatically." />
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const workspace = launchedProjects.find((project) => project.id === assignment.projectId) ?? null;

              return (
                <article key={assignment.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-ink">{assignment.generatedProjectTitle}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {assignment.cohortTitle ? `${assignment.cohortTitle} | ` : ""}
                        {assignment.status} | Assigned {new Date(assignment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{workspace ? "Workspace live" : "Assigned"}</span>
                  </div>

                  {workspace ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm leading-6 text-slate-700">{workspace.description}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={workspace.status} />
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{workspace.subject}</span>
                      </div>
                      <Link
                        href={`/app/projects/${workspace.id}`}
                        className="inline-flex rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                      >
                        Open workspace
                      </Link>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-600">This project has been assigned, but the workspace is not available yet.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </DashboardSection>
    </AppShell>
  );
}
