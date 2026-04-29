import { notFound } from "next/navigation";

import Link from "next/link";

import { getQuizAssignmentTargets } from "@/lib/assessments/queries";
import { GeneratedProjectAssignCohortForm } from "@/components/admin/generated-project-assign-cohort-form";
import { GeneratedProjectAssignStudentForm } from "@/components/admin/generated-project-assign-student-form";
import { GeneratedProjectEditorForm } from "@/components/admin/generated-project-editor-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState, MetricCard } from "@/components/dashboard/dashboard-primitives";
import { assertRole } from "@/lib/auth/roles";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { getGeneratedProjectAssignments, getGeneratedProjectById } from "@/lib/project-formulator/queries";

function SnapshotCard({
  title,
  summary,
  details,
  status
}: {
  title: string;
  summary: string;
  details: string;
  status: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{status}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">{summary}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{details}</p>
    </article>
  );
}

export default async function GeneratedProjectDraftPage({
  params
}: {
  params: Promise<{ draftProjectId: string }>;
}) {
  const { profile } = await getProfileForCurrentUser();
  assertRole(["teacher", "admin"], profile?.role ?? null);

  const { draftProjectId } = await params;
  const project = await getGeneratedProjectById(draftProjectId);

  if (!project) {
    notFound();
  }

  const [assignmentTargets, assignments] = await Promise.all([
    getQuizAssignmentTargets(profile!.id, profile!.role),
    getGeneratedProjectAssignments(draftProjectId)
  ]);

  return (
    <AppShell
      role={profile!.role}
      title={project.title}
      description="This editable draft preserves the exact catalog snapshots used to create it, while letting staff refine the student-facing plan before approval or later assignment."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Status" value={project.approvalStatus} detail="Use the editor actions below to save, approve, queue, or archive this draft." />
        <MetricCard label="Skill goal" value={project.skillGoal} detail="Primary learning focus chosen during formulation." />
        <MetricCard label="Interests" value={project.studentInterests.length > 0 ? String(project.studentInterests.length) : "0"} detail={project.studentInterests.length > 0 ? project.studentInterests.join(", ") : "No explicit interests were entered."} />
      </section>

      <DashboardSection
        title="Editable draft plan"
        description="This is the human-authored version first. Staff can revise every instructional section before the platform moves into assignment workflows."
      >
        <GeneratedProjectEditorForm project={project} />
      </DashboardSection>

      <DashboardSection
        title="Assignment and launch"
        description="Approved generated projects can now be assigned directly to a learner or to an entire cohort, and each assignment launches a real student project workspace."
      >
        {project.approvalStatus !== "approved" && project.approvalStatus !== "assigned" ? (
          <EmptyState title="Approve this draft before assigning it" description="Save the draft as approved first, then assign it to a student or cohort." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 p-5">
              {assignmentTargets.students.length === 0 ? (
                <EmptyState title="No student targets available" description="Students must exist in the current teacher/admin scope before this draft can be launched." />
              ) : (
                <GeneratedProjectAssignStudentForm
                  draftProjectId={project.id}
                  students={assignmentTargets.students.map((student) => ({ id: student.id, fullName: student.fullName }))}
                />
              )}
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 p-5">
              {assignmentTargets.cohorts.length === 0 ? (
                <EmptyState title="No cohorts available" description="Create a cohort first if you want to launch the project to a group of learners at once." />
              ) : (
                <GeneratedProjectAssignCohortForm draftProjectId={project.id} cohorts={assignmentTargets.cohorts} />
              )}
            </div>
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Assignment history"
        description="Each assignment creates or reconnects a real student project workspace while preserving the original generated project snapshots."
      >
        {assignments.length === 0 ? (
          <EmptyState title="No assignments yet" description="Assign this approved generated project to a learner or cohort to create real student workspaces." />
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <article key={assignment.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{assignment.studentName}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {assignment.cohortTitle ? `${assignment.cohortTitle} | ` : ""}
                      {assignment.status} | Assigned {new Date(assignment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {assignment.projectId ? (
                    <Link
                      href={`/app/projects/${assignment.projectId}`}
                      className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                    >
                      Open workspace
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Catalog snapshots"
        description="These snapshots preserve the exact catalog ingredients used when the draft was first generated."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SnapshotCard {...project.hookSnapshot} />
          <SnapshotCard {...project.roleSnapshot} />
          <SnapshotCard {...project.scenarioSnapshot} />
          <SnapshotCard {...project.activitySnapshot} />
          <SnapshotCard {...project.outputSnapshot} />
        </div>
      </DashboardSection>
    </AppShell>
  );
}
