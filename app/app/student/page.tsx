import Link from "next/link";

import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState, MetricCard, StatusBadge } from "@/components/dashboard/dashboard-primitives";
import { NotificationFeed } from "@/components/dashboard/notification-feed";
import { NotificationPreferenceForm } from "@/components/dashboard/notification-preference-form";
import { StudentProjectForm } from "@/components/dashboard/student-project-form";
import { SubmissionFileList } from "@/components/dashboard/submission-file-list";
import { assertRole } from "@/lib/auth/roles";
import { getStudentQuizAssignments } from "@/lib/assessments/queries";
import {
  getProfileForCurrentUser,
  getUserNotifications,
  getUserNotificationPreferences,
  getUserNotificationUnreadCount,
  getStudentAssessmentCount,
  getStudentTaskDeadlines,
  getStudentEnrolledPrograms,
  getStudentProjects
} from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/format";
import type { NotificationPreferenceRecord, NotificationRecord } from "@/types/domain";

export default async function StudentDashboardPage() {
  const { profile, user } = await getProfileForCurrentUser();
  assertRole(["student"], profile?.role ?? null);

  let notifications: NotificationRecord[] = [];
  let notificationError: string | null = null;
  let unreadNotificationCount = 0;
  let notificationPreferences: NotificationPreferenceRecord[] = [];
  try {
    [notifications, unreadNotificationCount, notificationPreferences] = await Promise.all([
      getUserNotifications(user!.id),
      getUserNotificationUnreadCount(user!.id),
      getUserNotificationPreferences(user!.id, "student")
    ]);
  } catch (error) {
    notificationError = (error as Error).message;
  }

  const [projects, assessments, assessmentCount, enrolledPrograms, taskDeadlines] = await Promise.all([
    getStudentProjects(user!.id),
    getStudentQuizAssignments(user!.id),
    getStudentAssessmentCount(user!.id),
    getStudentEnrolledPrograms(user!.id),
    getStudentTaskDeadlines(user!.id)
  ]);

  const feedbackCount = projects.filter((project) => project.latestFeedbackComment).length;
  const reviewedCount = projects.filter((project) => project.status === "reviewed").length;
  const gradedAssessmentCount = assessments.filter((assessment) => assessment.status === "graded").length;
  const primaryProgram = enrolledPrograms[0] ?? null;

  return (
    <AppShell
      role="student"
      title="Student dashboard"
      description="A modernized evolution of the original PBL prototype with project submission, file uploads, assessments, feedback, collaboration, and profile-aware learning workflows."
      unreadNotificationCount={unreadNotificationCount}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Projects submitted" value={String(projects.length)} detail="Live count from Supabase projects." />
        <MetricCard label="Feedback received" value={String(feedbackCount)} detail="Updates appear here as soon as a teacher responds." />
        <MetricCard
          label="Assessments tracked"
          value={String(assessmentCount)}
          detail={`${gradedAssessmentCount} graded, ${reviewedCount} project${reviewedCount === 1 ? "" : "s"} reviewed.`}
        />
      </section>

      <DashboardSection
        title="Reminders"
        description="Due-soon and overdue lesson reminders are delivered from the background reminder system and stored here for follow-through."
      >
        {notificationError ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Notifications could not be loaded right now: {notificationError}
          </div>
        ) : (
          <NotificationFeed notifications={notifications} emptyLabel="You do not have any due-date reminders right now." />
        )}
      </DashboardSection>

      <DashboardSection
        title="Reminder preferences"
        description="Control which student reminder types should appear in-app or by email for your account."
      >
        {notificationPreferences.length === 0 ? (
          <EmptyState title="No reminder preferences available" description="If reminder types have been disabled globally, there may be nothing to configure here yet." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {notificationPreferences.map((preference) => (
              <NotificationPreferenceForm key={preference.type} preference={preference} />
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Active program work"
        description="Enrolled programs are now the primary student journey, with progress and the next lesson surfaced before project submission."
      >
        {enrolledPrograms.length === 0 ? (
          <EmptyState
            title="No programs unlocked yet"
            description="Once a valid purchase is matched to your account, your enrolled programs and lesson progress will appear here."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-[1.75rem] bg-brand-700 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Continue learning</p>
              <h3 className="mt-3 text-3xl font-semibold">{primaryProgram?.title}</h3>
              <p className="mt-3 text-sm leading-7 text-blue-50">
                {primaryProgram?.nextLessonTitle
                  ? `Your next recommended lesson is ${primaryProgram.nextLessonTitle}.`
                  : "You have completed the currently published lesson path for this program."}
              </p>
              {primaryProgram ? (
                <Link
                  href={`/app/programs/${primaryProgram.slug}`}
                  className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-800 transition hover:bg-slate-100"
                >
                  Open program
                </Link>
              ) : null}
            </div>
            <div className="grid gap-4">
              {enrolledPrograms.map((program) => (
                <article key={program.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-ink">{program.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{program.description}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {program.progressPercent}% complete
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    {program.completedLessonCount} of {program.lessonCount} lessons complete.
                    {program.nextLessonTitle ? ` Next: ${program.nextLessonTitle}.` : ""}
                  </p>
                  <Link
                    href={`/app/programs/${program.slug}`}
                    className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900"
                  >
                    Resume program
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Due next and needing attention"
        description="Upcoming deadlines, overdue lesson work, and submissions awaiting feedback are surfaced here so the next action is clear."
      >
        {taskDeadlines.length === 0 ? (
          <EmptyState title="No scheduled lesson work yet" description="Once lesson tasks have due dates, they will show up here with their status." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {taskDeadlines.slice(0, 6).map((task) => (
              <article key={task.taskId} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{task.taskTitle}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {task.programTitle} | {task.lessonTitle}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{task.dueState.replace("_", " ")}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {task.taskType} | {task.status} | {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                </p>
                {task.latestFeedbackComment ? <p className="mt-3 text-sm text-brand-900">{task.latestFeedbackComment}</p> : null}
                <Link
                  href={`/app/programs/${task.programSlug}`}
                  className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900"
                >
                  Open lesson work
                </Link>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <DashboardSection
          className="scroll-mt-24"
          title="Submit a new project"
          description="Attach evidence, send it to the teacher queue, and keep the latest files and feedback together in one record."
        >
          <div id="projects">
            <StudentProjectForm />
          </div>
        </DashboardSection>

        <DashboardSection
          className="scroll-mt-24"
          title="Your submitted projects"
          description="Project status, submission content, uploaded files, and the latest teacher feedback are loaded directly from Supabase."
        >
          {projects.length === 0 ? (
            <EmptyState
              title="No projects submitted yet"
              description="Use the project form to create your first project and send it to the teacher review queue."
            />
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <article key={project.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-ink">{project.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{project.subject}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{project.description}</p>
                  {project.latestSubmissionText ? (
                    <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Latest submission</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{project.latestSubmissionText}</p>
                    </div>
                  ) : null}
                  <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Attached files</p>
                    <div className="mt-3">
                      <SubmissionFileList files={project.files} />
                    </div>
                  </div>
                  <div className="mt-4 rounded-3xl bg-brand-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Latest feedback</p>
                    {project.latestFeedbackComment ? (
                      <>
                        <p className="mt-2 text-sm leading-6 text-brand-900">{project.latestFeedbackComment}</p>
                        <p className="mt-3 text-sm font-semibold text-brand-900">
                          {project.latestFeedbackTeacher} | {project.latestFeedbackScore?.toFixed(1)}/10
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-brand-900">Your teacher has not left feedback yet.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

      <DashboardSection
        className="scroll-mt-24"
        title="Assigned quizzes"
        description="Open assigned quizzes, complete them, and receive AI instant grading before the teacher review arrives."
      >
        <div id="assessments">
          {assessments.length === 0 ? (
            <EmptyState
              title="No quizzes assigned yet"
              description="Once a teacher creates or generates a quiz for you, it will appear here with due dates and status."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {assessments.map((assessment) => (
                <article key={assessment.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-ink">{assessment.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{assessment.subject}</p>
                    </div>
                    <StatusBadge status={assessment.status} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{assessment.description}</p>
                  <p className="mt-4 text-sm text-slate-500">
                    Due: {formatDate(assessment.dueDate)} | {assessment.questionCount} question{assessment.questionCount === 1 ? "" : "s"}
                  </p>
                  <div className="mt-4 rounded-3xl bg-brand-50 p-4">
                    {assessment.aiScore !== null ? (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">AI grading</p>
                        <p className="mt-2 text-lg font-semibold text-brand-900">{assessment.aiScore?.toFixed(1)}/100</p>
                        <p className="mt-2 text-sm leading-6 text-brand-900">{assessment.aiFeedback}</p>
                        {assessment.teacherComment ? <p className="mt-3 text-sm leading-6 text-brand-900">{assessment.teacherComment}</p> : null}
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Status</p>
                        <p className="mt-2 text-sm text-brand-900">This quiz is assigned and ready for you to complete.</p>
                      </>
                    )}
                  </div>
                  <Link
                    href={`/app/student/quizzes/${assessment.id}`}
                    className="mt-4 inline-flex rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                  >
                    {assessment.status === "assigned" ? "Open quiz" : "Review results"}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </DashboardSection>
    </AppShell>
  );
}
