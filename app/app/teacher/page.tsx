import { CohortCreateForm } from "@/components/dashboard/cohort-create-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { AssessmentDeleteForm } from "@/components/dashboard/assessment-delete-form";
import { DashboardSection, EmptyState, MetricCard, StatusBadge } from "@/components/dashboard/dashboard-primitives";
import { NotificationFeed } from "@/components/dashboard/notification-feed";
import { NotificationPreferenceForm } from "@/components/dashboard/notification-preference-form";
import { QuizAiGenerateForm } from "@/components/dashboard/quiz-ai-generate-form";
import { QuizManualCreateForm } from "@/components/dashboard/quiz-manual-create-form";
import { QuizReviewForm } from "@/components/dashboard/quiz-review-form";
import { SubmissionFileList } from "@/components/dashboard/submission-file-list";
import { TeacherFeedbackForm } from "@/components/dashboard/teacher-feedback-form";
import { TeacherLearnerAssignForm } from "@/components/dashboard/teacher-learner-assign-form";
import { getQuizAssignmentTargets, getTeacherQuizAnalytics, getTeacherQuizAssignments } from "@/lib/assessments/queries";
import { assertRole } from "@/lib/auth/roles";
import {
  getProfileForCurrentUser,
  getTeacherAssignedLearners,
  getTeacherCohorts,
  getUserNotifications,
  getUserNotificationPreferences,
  getUserNotificationUnreadCount,
  getTeacherProgramProgressFeed,
  getTeacherSubmissionFeed,
  getTeacherSummary,
  getTeacherTriageRecords
} from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/format";
import type { NotificationPreferenceRecord, NotificationRecord } from "@/types/domain";

export default async function TeacherDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ learner?: string; program?: string; task_type?: string; due_state?: string; review_status?: string; cohort?: string }>;
}) {
  const { profile, user } = await getProfileForCurrentUser();
  assertRole(["teacher", "admin"], profile?.role ?? null);
  const params = await searchParams;

  let notifications: NotificationRecord[] = [];
  let notificationError: string | null = null;
  let unreadNotificationCount = 0;
  let notificationPreferences: NotificationPreferenceRecord[] = [];
  if (profile?.role === "teacher") {
    try {
      [notifications, unreadNotificationCount, notificationPreferences] = await Promise.all([
        getUserNotifications(user!.id),
        getUserNotificationUnreadCount(user!.id),
        getUserNotificationPreferences(user!.id, "teacher")
      ]);
    } catch (error) {
      notificationError = (error as Error).message;
    }
  }

  const [submissions, assessments, summary, programProgress, quizTargets, cohorts, assignedLearners, triageRecords, quizAnalytics] = await Promise.all([
    getTeacherSubmissionFeed({
      learnerId: params.learner,
      programId: params.program,
      reviewStatus: params.review_status
    }),
    getTeacherQuizAssignments(user!.id, profile!.role),
    getTeacherSummary(),
    getTeacherProgramProgressFeed({
      learnerId: params.learner,
      programId: params.program,
      dueState: params.due_state,
      cohortId: params.cohort
    }),
    getQuizAssignmentTargets(user!.id, profile!.role),
    getTeacherCohorts(),
    getTeacherAssignedLearners(),
    getTeacherTriageRecords({
      learnerId: params.learner,
      programId: params.program,
      taskType: params.task_type,
      dueState: params.due_state,
      reviewStatus: params.review_status,
      cohort: params.cohort
    }),
    getTeacherQuizAnalytics(user!.id, profile!.role)
  ]);

  const gradedAssessments = assessments.filter((assessment) => assessment.status === "graded").length;
  const programOptions = Array.from(new Map(programProgress.map((record) => [record.programId, record.programTitle])).entries()).map(([id, title]) => ({ id, title }));

  return (
    <AppShell
      role="teacher"
      title="Teacher dashboard"
      description="Teachers can manage cohorts, triage deadlines, review lesson-linked submissions, and keep learner progress moving inside the same program system."
      unreadNotificationCount={unreadNotificationCount}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Submissions waiting" value={String(summary.submissionCount)} detail="Student lesson work and project work flow into the same review queue." />
        <MetricCard label="Feedback sent" value={String(summary.feedbackCount)} detail="Teacher responses are written directly to Supabase." />
        <MetricCard label="Assessments" value={String(summary.assessmentCount)} detail={`${gradedAssessments} graded and visible in student dashboards.`} />
      </section>

      <DashboardSection
        title="Alerts"
        description="Review queue and overdue-attention alerts are delivered from the scheduled reminder engine using your current learner assignments and triage scope."
      >
        {profile?.role === "admin" ? (
          <EmptyState title="Admin account in teacher view" description="Teacher alert generation is scoped to teacher assignments, so admin accounts do not receive teacher reminder digests here." />
        ) : notificationError ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Teacher alerts could not be loaded right now: {notificationError}
          </div>
        ) : (
          <NotificationFeed notifications={notifications} emptyLabel="No teacher alerts are active right now." />
        )}
      </DashboardSection>

      {profile?.role === "teacher" ? (
        <DashboardSection
          title="Alert preferences"
          description="Control whether teacher alerts arrive in-app or by email for your account."
        >
          {notificationPreferences.length === 0 ? (
            <EmptyState title="No alert preferences available" description="If teacher alert types have been disabled globally, there may be nothing to configure here yet." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {notificationPreferences.map((preference) => (
                <NotificationPreferenceForm key={preference.type} preference={preference} />
              ))}
            </div>
          )}
        </DashboardSection>
      ) : null}

      <DashboardSection
        title="Classroom setup"
        description="Create cohorts, assign learners, and shape the teacher-to-learner scope that powers the workflow filters below."
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ink">Create cohort</h3>
            <CohortCreateForm programs={programOptions} />
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ink">Assign learner</h3>
            {quizTargets.students.length === 0 ? (
              <EmptyState title="No learners available" description="Students need accounts before they can be assigned." />
            ) : (
              <TeacherLearnerAssignForm
                students={quizTargets.students.map((student) => ({ id: student.id, fullName: student.fullName }))}
                cohorts={cohorts.map((cohort) => ({ id: cohort.id, title: cohort.title }))}
              />
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ink">Your cohorts</h3>
            {cohorts.length === 0 ? (
              <EmptyState title="No cohorts yet" description="Create a cohort to group learners by class, program, or support track." />
            ) : (
              <div className="space-y-3">
                {cohorts.map((cohort) => (
                  <article key={cohort.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                    <p className="text-lg font-semibold text-ink">{cohort.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{cohort.description}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {cohort.learnerCount} learner{cohort.learnerCount === 1 ? "" : "s"} | {cohort.programTitle ?? "General cohort"}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-ink">Assigned learners</h3>
            {assignedLearners.length === 0 ? (
              <EmptyState title="No learners assigned yet" description="Assign learners to begin using cohort-aware triage and progress filters." />
            ) : (
              <div className="space-y-3">
                {assignedLearners.map((learner) => (
                  <article key={learner.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                    <p className="text-lg font-semibold text-ink">{learner.fullName}</p>
                    <p className="mt-2 text-sm text-slate-500">{learner.cohortTitle ?? "No cohort assigned"}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Attention triage"
        description="Filter by learner, program, task type, due status, review state, or cohort to surface the next tasks needing teacher attention."
      >
        <form method="get" className="mb-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <select name="learner" defaultValue={params.learner ?? ""} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
            <option value="">All learners</option>
            {assignedLearners.map((learner) => (
              <option key={learner.id} value={learner.id}>
                {learner.fullName}
              </option>
            ))}
          </select>
          <select name="program" defaultValue={params.program ?? ""} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
            <option value="">All programs</option>
            {programOptions.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
          <select name="task_type" defaultValue={params.task_type ?? ""} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
            <option value="">All task types</option>
            <option value="checkpoint">Checkpoint</option>
            <option value="submission">Submission</option>
          </select>
          <select name="due_state" defaultValue={params.due_state ?? ""} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
            <option value="">All due states</option>
            <option value="overdue">Overdue</option>
            <option value="due_soon">Due soon</option>
            <option value="awaiting_feedback">Awaiting feedback</option>
            <option value="upcoming">Upcoming</option>
            <option value="attention">Needs attention</option>
          </select>
          <select name="review_status" defaultValue={params.review_status ?? ""} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
            <option value="">All review states</option>
            <option value="submitted">Submitted</option>
            <option value="needs_revision">Needs revision</option>
            <option value="completed">Completed</option>
            <option value="not_started">Not started</option>
          </select>
          <select name="cohort" defaultValue={params.cohort ?? ""} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
            <option value="">All cohorts</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.title}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
            Apply filters
          </button>
        </form>

        {triageRecords.length === 0 ? (
          <EmptyState title="No tasks match this filter" description="Try widening the filters or assign learners to start building a classroom view." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {triageRecords.map((record) => (
              <article key={`${record.studentId}-${record.taskId}`} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{record.studentName}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {record.programTitle} | {record.lessonTitle}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{record.dueState.replace("_", " ")}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">{record.taskTitle}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {record.taskType} | {record.status} | {record.cohortTitle ?? "No cohort"}
                </p>
                <p className="mt-2 text-sm text-slate-500">{record.dueDate ? `Due ${formatDate(record.dueDate)}` : "No due date"}</p>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Program learning progress"
        description="See how enrolled learners are moving through modules, where reflections are happening, and which lesson tasks still need review."
      >
        {programProgress.length === 0 ? (
          <EmptyState
            title="No enrolled learners yet"
            description="Once students are enrolled in programs, their lesson progress and task status will appear here."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {programProgress.map((record) => (
              <article key={record.enrollmentId} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">{record.studentName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{record.programTitle}</p>
                    {record.cohortTitle ? <p className="mt-1 text-sm text-brand-700">{record.cohortTitle}</p> : null}
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                    {record.progressPercent}% progress
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Lesson completion</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">
                      {record.completedLessons}/{record.totalLessons}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-brand-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Tasks needing attention</p>
                    <p className="mt-2 text-2xl font-semibold text-brand-900">
                      {record.pendingSubmissionTasks + record.needsRevisionTasks}
                    </p>
                    <p className="mt-2 text-sm text-brand-900">
                      {record.pendingSubmissionTasks} submitted, {record.needsRevisionTasks} needing revision
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Latest reflection</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{record.latestReflectionLessonTitle ?? "No reflection yet"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {record.latestReflectionNote ?? "Once the learner saves reflections in lessons, they will surface here."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Build quizzes"
        description="Create quizzes manually or generate them with AI, assign them to learners or cohorts, and set due dates inside the same teacher workspace."
      >
        {quizTargets.students.length === 0 ? (
          <EmptyState title="No assigned student accounts available" description="Assign learners first before you create quizzes for them." />
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-ink">Manual quiz builder</h3>
              <QuizManualCreateForm
                students={quizTargets.students.map((student) => ({ id: student.id, fullName: student.fullName }))}
                cohorts={quizTargets.cohorts}
              />
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-ink">AI quiz generator</h3>
              <QuizAiGenerateForm
                students={quizTargets.students.map((student) => ({ id: student.id, fullName: student.fullName }))}
                cohorts={quizTargets.cohorts}
              />
            </div>
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Submission review queue"
        description="Review student work, download files, leave feedback, and the student dashboard will update after revalidation."
      >
        {submissions.length === 0 ? (
          <EmptyState title="No submissions match this filter" description="Once a learner submits program or project work, it will appear here for review." />
        ) : (
          <div className="space-y-5">
            {submissions.map((submission) => (
              <article key={submission.submissionId} className="grid gap-5 rounded-[1.5rem] border border-slate-200 p-5 xl:grid-cols-[1fr,0.95fr]">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-ink">{submission.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {submission.subject} | {submission.studentName}
                      </p>
                      {submission.contextLabel ? <p className="mt-1 text-sm text-brand-700">{submission.contextLabel}</p> : null}
                    </div>
                    <StatusBadge status={submission.projectStatus} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{submission.description}</p>
                  <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Submission</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{submission.submissionText}</p>
                  </div>
                  <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Attached files</p>
                    <div className="mt-3">
                      <SubmissionFileList files={submission.files} emptyLabel="The student did not upload files for this submission." />
                    </div>
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
                      <p className="mt-2 text-sm text-brand-900">No feedback has been sent yet for this submission.</p>
                    )}
                  </div>
                </div>
                <TeacherFeedbackForm submissionId={submission.submissionId} projectId={submission.projectId} studentId={submission.studentId} />
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Quiz review queue"
        description="Track AI-graded quizzes, add human feedback, override grades, and surface the learners or topics that need the most attention."
      >
        {assessments.length === 0 ? (
          <EmptyState title="No quizzes yet" description="Use the quiz builders above to create the first quiz for an assigned learner or cohort." />
        ) : (
          <div className="space-y-5">
            {assessments.map((assessment) => (
              <article key={assessment.id} className="grid gap-5 rounded-[1.5rem] border border-slate-200 p-5 xl:grid-cols-[1fr,0.9fr]">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-ink">{assessment.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {assessment.subject} | {assessment.studentName}
                      </p>
                    </div>
                    <StatusBadge status={assessment.status} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{assessment.description}</p>
                  <p className="mt-4 text-sm text-slate-500">
                    Due: {formatDate(assessment.dueDate)} | {assessment.questionCount} question{assessment.questionCount === 1 ? "" : "s"} | {assessment.source === "ai" ? "AI-generated" : "Manual"}
                  </p>
                  {assessment.aiScore !== null ? (
                    <div className="mt-4 rounded-3xl bg-brand-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">AI grading</p>
                      <p className="mt-2 text-lg font-semibold text-brand-900">{assessment.aiScore?.toFixed(1)}/100</p>
                      <p className="mt-2 text-sm leading-6 text-brand-900">{assessment.aiFeedback}</p>
                      {assessment.weakTopics.length > 0 ? (
                        <p className="mt-3 text-sm text-brand-900">Weak topics: {assessment.weakTopics.join(", ")}</p>
                      ) : null}
                      {assessment.teacherComment ? (
                        <div className="mt-4 rounded-3xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Human review</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{assessment.teacherComment}</p>
                          {assessment.teacherOverrideScore !== null ? <p className="mt-3 text-sm font-semibold text-slate-700">Override score: {assessment.teacherOverrideScore.toFixed(1)}%</p> : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-4">
                  <QuizReviewForm
                    assessmentId={assessment.id}
                    existingComment={assessment.teacherComment}
                    existingOverrideScore={assessment.teacherOverrideScore}
                  />
                  <AssessmentDeleteForm assessmentId={assessment.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Weak topic analytics"
        description="AI instant grading aggregates missed topic tags so you can quickly spot where the current quiz set is revealing the most struggle."
      >
        {quizAnalytics.length === 0 ? (
          <EmptyState title="No topic analytics yet" description="Analytics appear after learners submit quizzes and the AI grading engine identifies weak topic areas." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {quizAnalytics.map((topic) => (
              <article key={topic.topic} className="rounded-[1.5rem] border border-slate-200 p-5">
                <p className="text-lg font-semibold text-ink">{topic.topic}</p>
                <p className="mt-3 text-sm text-slate-600">{topic.missCount} misses across {topic.learnerCount} learner{topic.learnerCount === 1 ? "" : "s"}.</p>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>
    </AppShell>
  );
}
