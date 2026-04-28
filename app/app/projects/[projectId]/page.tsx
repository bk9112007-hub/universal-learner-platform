import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileStack,
  Flag,
  Lightbulb,
  MessageSquareText,
  PencilLine,
  Sparkles,
  Target
} from "lucide-react";

import { ProjectChecklistTaskForm } from "@/components/dashboard/project-checklist-task-form";
import { ProjectMilestoneForm } from "@/components/dashboard/project-milestone-form";
import { ProjectReflectionForm } from "@/components/dashboard/project-reflection-form";
import { ProjectResourceForm } from "@/components/dashboard/project-resource-form";
import { ProjectSubmissionForm } from "@/components/dashboard/project-submission-form";
import { ProjectTaskForm } from "@/components/dashboard/project-task-form";
import { ProjectWorkspaceSummaryForm } from "@/components/dashboard/project-workspace-summary-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState, MetricCard, StatusBadge } from "@/components/dashboard/dashboard-primitives";
import { SubmissionFileList } from "@/components/dashboard/submission-file-list";
import { TeacherFeedbackForm } from "@/components/dashboard/teacher-feedback-form";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/format";
import { getProjectWorkspace } from "@/lib/projects/workspace";
import type { ProjectWorkspaceTaskRecord } from "@/types/domain";

function getRoleRedirect(role: string | null | undefined) {
  if (role === "teacher") return "/app/teacher";
  if (role === "parent") return "/app/parent";
  if (role === "admin") return "/app/admin";
  return "/app/student";
}

function getTaskStatusLabel(status: "not_started" | "in_progress" | "submitted" | "completed" | "needs_revision") {
  if (status === "completed") return "Completed";
  if (status === "submitted") return "Submitted";
  if (status === "needs_revision") return "Needs revision";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

function getTaskStatusClasses(status: "not_started" | "in_progress" | "submitted" | "completed" | "needs_revision") {
  if (status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "submitted") return "bg-brand-50 text-brand-800";
  if (status === "needs_revision") return "bg-amber-50 text-amber-700";
  if (status === "in_progress") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { profile } = await getProfileForCurrentUser();
  const workspace = await getProjectWorkspace(projectId);

  if (!profile || !workspace) {
    redirect(getRoleRedirect(profile?.role));
  }

  const projectWorkspace = workspace;
  const nextTask =
    projectWorkspace.tasks.find((task) => task.status !== "completed" && task.status !== "submitted") ?? projectWorkspace.tasks[0] ?? null;
  const ungroupedTasks = projectWorkspace.tasks.filter(
    (task) => !task.milestoneId || !projectWorkspace.milestones.some((milestone) => milestone.id === task.milestoneId)
  );

  function renderTaskCard(task: ProjectWorkspaceTaskRecord) {
    return (
      <div key={task.id} id={`task-${task.id}`} className="rounded-[1.5rem] bg-slate-50 p-5 scroll-mt-24">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h4 className="text-lg font-semibold text-ink">{task.title}</h4>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTaskStatusClasses(task.status)}`}>
                {getTaskStatusLabel(task.status)}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {task.taskType === "submission" ? "Submission task" : "Checklist task"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
          </div>
          <div className="text-right">
            {task.dueDate ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                <CalendarDays className="h-3.5 w-3.5 text-brand-700" />
                Due {formatDate(task.dueDate)}
              </p>
            ) : null}
            <p className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {task.isRequired ? "Required" : "Optional"}
            </p>
          </div>
        </div>

        {task.responseText ? (
          <div className="mt-4 rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Latest learner note</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{task.responseText}</p>
          </div>
        ) : null}

        {task.latestSubmissionText ? (
          <div className="mt-4 rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Latest submission</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{task.latestSubmissionText}</p>
            <div className="mt-3">
              <SubmissionFileList files={task.files} emptyLabel="No files were attached to this task submission." />
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-3xl bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Teacher feedback</p>
          {task.latestFeedbackComment ? (
            <>
              <p className="mt-2 text-sm leading-6 text-brand-900">{task.latestFeedbackComment}</p>
              <p className="mt-3 text-sm font-semibold text-brand-900">
                {task.latestFeedbackTeacher} | {task.latestFeedbackScore?.toFixed(1)}/10
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-brand-900">No feedback has been attached to this task yet.</p>
          )}
        </div>

        {projectWorkspace.canStudentEdit ? (
          <div className="mt-4">
            {task.taskType === "submission" ? (
              <ProjectSubmissionForm projectId={projectWorkspace.id} taskId={task.id} />
            ) : (
              <ProjectChecklistTaskForm projectId={projectWorkspace.id} taskId={task.id} defaultValue={task.responseText} />
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {projectWorkspace.accessRole === "parent"
              ? "This task is shown in read-only mode because execution belongs to the linked learner account."
              : projectWorkspace.accessRole === "teacher"
                ? "Use the submission and feedback sections below to review learner work in teacher context."
                : "Admin inspection mode does not submit learner task work."}
          </p>
        )}
      </div>
    );
  }

  return (
    <AppShell
      role={profile.role}
      title={projectWorkspace.title}
      description="The Project Workspace turns personalized briefs into a real execution environment with milestones, tasks, progress tracking, file submissions, reflections, and feedback."
    >
      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Progress" value={`${projectWorkspace.progressPercent}%`} detail={`${projectWorkspace.completedTaskCount} of ${projectWorkspace.taskCount} tasks completed or submitted.`} />
        <MetricCard label="Milestones" value={String(projectWorkspace.milestones.length)} detail="Structured checkpoints that anchor the project from kickoff through final delivery." />
        <MetricCard label="Resources" value={String(projectWorkspace.resources.length)} detail="Teacher-curated links and notes that support execution without leaving the workspace." />
        <MetricCard label="Access" value={projectWorkspace.accessRole === "student" ? "Student" : projectWorkspace.accessRole === "teacher" ? "Teacher" : projectWorkspace.accessRole === "parent" ? "Parent" : "Admin"} detail={projectWorkspace.accessLabel} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.34fr,0.66fr]">
        <DashboardSection
          title="Workspace navigation"
          description="Jump to the next task, inspect milestones, and keep the project plan visible while work is in motion."
          className="h-fit"
        >
          <div className="space-y-5">
            <div className="rounded-[1.5rem] bg-brand-700 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Next best action</p>
              <h3 className="mt-3 text-xl font-semibold">{nextTask ? nextTask.title : "Project structure ready"}</h3>
              <p className="mt-2 text-sm text-blue-50">
                {nextTask
                  ? "Use the task list below to move the project forward, upload evidence, and keep teacher review attached to the right work."
                  : "This workspace does not have project tasks yet. Teachers and admins can add them from the management panel."}
              </p>
              {nextTask ? (
                <a
                  href={`#task-${nextTask.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-brand-800"
                >
                  Go to next task
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ClipboardList className="h-4 w-4 text-brand-700" />
                Project status
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge status={workspace.status} />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{workspace.studentName}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {workspace.personalizedBriefTitle
                  ? `Connected to the personalized brief "${workspace.personalizedBriefTitle}".`
                  : "This project is being executed as a standalone workspace without a personalized brief."}
              </p>
            </div>

            {workspace.milestones.length === 0 ? (
              <EmptyState title="No milestones yet" description="Add milestone structure to guide the learner through planning, production, and final delivery." />
            ) : (
              workspace.milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-brand-700" />
                        <h3 className="text-lg font-semibold text-ink">{milestone.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{milestone.description}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {milestone.completedTaskCount}/{milestone.taskCount} tasks
                    </span>
                  </div>
                  {milestone.dueDate ? <p className="mt-3 text-sm text-slate-500">Due {formatDate(milestone.dueDate)}</p> : null}
                </div>
              ))
            )}
          </div>
        </DashboardSection>

        <div className="space-y-6">
          <DashboardSection
            title="Project overview"
            description="A premium workspace view of the project brief, learner fit, target growth areas, rubric expectations, and timeline."
          >
            <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm leading-7 text-slate-700">{workspace.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      <Sparkles className="h-4 w-4 text-brand-700" />
                      {workspace.personalizedBriefTitle ? "Personalized workspace" : "Project workspace"}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      <Target className="h-4 w-4 text-brand-700" />
                      {workspace.subject}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-brand-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Personalized reason / fit</p>
                  <p className="mt-3 text-sm leading-7 text-brand-950">
                    {workspace.personalizedReason ?? "A teacher can add a clearer personalized fit summary for this workspace."}
                  </p>
                  {workspace.teacherPriorities ? <p className="mt-3 text-sm text-brand-900">Teacher priorities: {workspace.teacherPriorities}</p> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Target skills</p>
                    {workspace.targetSkills.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">No target skills defined yet.</p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {workspace.targetSkills.map((skill) => (
                          <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Timeline</p>
                    {workspace.timeline.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">No timeline steps added yet.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {workspace.timeline.map((entry) => (
                          <div key={`${entry.label}-${entry.goal}`} className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-sm font-semibold text-ink">{entry.label}</p>
                            <p className="mt-1 text-sm text-slate-600">{entry.goal}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Rubric</p>
                  {workspace.rubric.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">No rubric criteria defined yet.</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {workspace.rubric.map((criterion) => (
                        <div key={`${criterion.criterion}-${criterion.description}`} className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-ink">{criterion.criterion}</p>
                          <p className="mt-1 text-sm text-slate-600">{criterion.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {workspace.canTeacherManage ? (
                  <div className="rounded-[1.5rem] border border-slate-200 p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <PencilLine className="h-4 w-4 text-brand-700" />
                      Teacher workspace controls
                    </div>
                    <ProjectWorkspaceSummaryForm
                      projectId={workspace.id}
                      personalizedReason={workspace.personalizedReason}
                      targetSkills={workspace.targetSkills}
                      rubric={workspace.rubric}
                      timeline={workspace.timeline}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Milestones and tasks"
            description="Students execute the project here, teachers manage the structure here, and parents can follow progress in read-only form."
          >
            <div className="space-y-6">
              {workspace.milestones.length === 0 && workspace.tasks.length === 0 ? (
                <EmptyState title="No project plan published yet" description="Add milestones or tasks to turn this project into an actionable workspace." />
              ) : (
                workspace.milestones.map((milestone) => {
                  const milestoneTasks = workspace.tasks.filter((task) => task.milestoneId === milestone.id);

                  return (
                    <article key={milestone.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-brand-700" />
                            <h3 className="text-xl font-semibold text-ink">{milestone.title}</h3>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{milestone.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {milestone.completedTaskCount}/{milestone.taskCount} tasks complete
                          </p>
                          {milestone.dueDate ? <p className="mt-2 text-sm text-slate-500">Due {formatDate(milestone.dueDate)}</p> : null}
                        </div>
                      </div>

                      {workspace.canTeacherManage ? (
                        <div className="mt-4">
                          <ProjectMilestoneForm projectId={workspace.id} milestone={milestone} />
                        </div>
                      ) : null}

                      <div className="mt-5 space-y-4">
                        {milestoneTasks.length === 0 ? (
                          <EmptyState title="No tasks in this milestone yet" description="Tasks can be added to break the milestone into clear actions or submission steps." />
                        ) : (
                          milestoneTasks.map((task) => renderTaskCard(task))
                        )}
                      </div>
                    </article>
                  );
                })
              )}

              {ungroupedTasks.length > 0 ? (
                <article className="rounded-[1.5rem] border border-slate-200 p-5">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-brand-700" />
                    <h3 className="text-xl font-semibold text-ink">Additional project tasks</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">These tasks are active in the workspace but are not attached to a milestone yet.</p>
                  <div className="mt-5 space-y-4">{ungroupedTasks.map((task) => renderTaskCard(task))}</div>
                </article>
              ) : null}

              {workspace.canTeacherManage ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 p-5">
                    <h3 className="text-lg font-semibold text-ink">Add milestone</h3>
                    <p className="mt-2 text-sm text-slate-600">Shape the project into visible phases that students and families can follow.</p>
                    <div className="mt-4">
                      <ProjectMilestoneForm projectId={workspace.id} />
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 p-5">
                    <h3 className="text-lg font-semibold text-ink">Add task</h3>
                    <p className="mt-2 text-sm text-slate-600">Create checklists for steady progress or submission tasks that flow into teacher review.</p>
                    <div className="mt-4">
                      <ProjectTaskForm projectId={workspace.id} milestones={workspace.milestones} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </DashboardSection>

          <DashboardSection
            title="Resources and reflection"
            description="Resources keep support material close to the work, while reflections capture learner thinking across the project arc."
          >
            <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
              <div>
                {workspace.resources.length === 0 ? (
                  <EmptyState title="No project resources yet" description="Teachers and admins can add links or notes that support the learner through the project." />
                ) : (
                  <div className="space-y-4">
                    {workspace.resources.map((resource) => (
                      <article key={resource.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-ink">{resource.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {resource.resourceType === "link" ? "Link" : "Note"}
                          </span>
                        </div>
                        {resource.externalUrl ? (
                          <Link
                            href={resource.externalUrl}
                            target="_blank"
                            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900"
                          >
                            Open resource
                          </Link>
                        ) : null}
                        {workspace.canTeacherManage ? (
                          <div className="mt-4">
                            <ProjectResourceForm projectId={workspace.id} resource={resource} />
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}

                {workspace.canTeacherManage ? (
                  <div className="mt-4 rounded-[1.5rem] border border-slate-200 p-5">
                    <h3 className="text-lg font-semibold text-ink">Add project resource</h3>
                    <p className="mt-2 text-sm text-slate-600">Resources can be a live link or a short note that keeps project guidance close to the learner.</p>
                    <div className="mt-4">
                      <ProjectResourceForm projectId={workspace.id} />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MessageSquareText className="h-4 w-4 text-brand-700" />
                  Reflection and notes
                </div>
                {workspace.canStudentEdit ? (
                  <div className="mt-4">
                    <ProjectReflectionForm projectId={workspace.id} defaultValue={workspace.reflectionNote} />
                  </div>
                ) : workspace.reflectionNote ? (
                  <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-5">
                    <p className="text-sm leading-7 text-slate-700">{workspace.reflectionNote}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      Updated {workspace.reflectionUpdatedAt ? formatDate(workspace.reflectionUpdatedAt) : "recently"}
                    </p>
                  </div>
                ) : (
                  <EmptyState
                    title="No reflection saved yet"
                    description={
                      workspace.accessRole === "parent"
                        ? "The learner has not saved a project reflection yet."
                        : workspace.accessRole === "teacher"
                          ? "Learner reflections will appear here once the student saves project notes."
                          : "No project reflection is available yet."
                    }
                  />
                )}
              </div>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Submissions and teacher review"
            description="Every submission, file, and feedback entry stays connected to the same project record for clearer review history."
          >
            {workspace.submissions.length === 0 ? (
              <EmptyState title="No project submissions yet" description="Once the student uploads work from a submission task, it will appear here for review." />
            ) : (
              <div className="space-y-5">
                {workspace.submissions.map((submission) => (
                  <article key={submission.id} className="grid gap-5 rounded-[1.5rem] border border-slate-200 p-5 xl:grid-cols-[1fr,0.95fr]">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-ink">Submission #{submission.id.slice(0, 8)}</h3>
                          <p className="mt-1 text-sm text-slate-500">Submitted {formatDate(submission.submittedAt)}</p>
                        </div>
                        <StatusBadge status={submission.status} />
                      </div>
                      <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Submission text</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{submission.submissionText}</p>
                      </div>
                      <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <FileStack className="h-4 w-4 text-brand-700" />
                          Attached files
                        </div>
                        <SubmissionFileList files={submission.files} emptyLabel="No files were attached to this submission." />
                      </div>
                      <div className="mt-4 rounded-3xl bg-brand-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Latest teacher feedback</p>
                        {submission.feedbackComment ? (
                          <>
                            <p className="mt-2 text-sm leading-6 text-brand-900">{submission.feedbackComment}</p>
                            <p className="mt-3 text-sm font-semibold text-brand-900">
                              {submission.feedbackTeacher} | {submission.feedbackScore?.toFixed(1)}/10
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-brand-900">This submission is still waiting for teacher review.</p>
                        )}
                      </div>
                    </div>

                    {workspace.canTeacherManage ? (
                      <TeacherFeedbackForm submissionId={submission.id} projectId={workspace.id} studentId={workspace.studentId} />
                    ) : (
                      <div className="rounded-[1.5rem] bg-slate-50 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-brand-700" />
                          Review status
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {workspace.accessRole === "student"
                            ? "Teacher feedback added here will update both the project workspace and your dashboard automatically."
                            : workspace.accessRole === "parent"
                              ? "Parents can read quiz and project feedback here after teachers review the learner's work."
                              : "Admin inspection mode shows the latest review status without editing learner feedback."}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>
    </AppShell>
  );
}
