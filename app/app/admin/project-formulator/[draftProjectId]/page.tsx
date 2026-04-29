import { notFound } from "next/navigation";

import { GeneratedProjectEditorForm } from "@/components/admin/generated-project-editor-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, MetricCard } from "@/components/dashboard/dashboard-primitives";
import { assertRole } from "@/lib/auth/roles";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { getGeneratedProjectById } from "@/lib/project-formulator/queries";

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
