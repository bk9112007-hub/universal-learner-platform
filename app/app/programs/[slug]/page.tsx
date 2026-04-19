import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenText, CheckCircle2, Clock3, Download, ExternalLink, GraduationCap, Layers3, NotebookPen } from "lucide-react";

import { LessonCheckpointForm } from "@/components/dashboard/lesson-checkpoint-form";
import { LessonProgressButton } from "@/components/dashboard/lesson-progress-button";
import { LessonReflectionForm } from "@/components/dashboard/lesson-reflection-form";
import { LessonTaskSubmissionForm } from "@/components/dashboard/lesson-task-submission-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState, MetricCard } from "@/components/dashboard/dashboard-primitives";
import { SubmissionFileList } from "@/components/dashboard/submission-file-list";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { getProgramDelivery } from "@/lib/programs/delivery";

function getStatusLabel(status: "not_started" | "in_progress" | "completed") {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

function getStatusClasses(status: "not_started" | "in_progress" | "completed") {
  if (status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "bg-brand-50 text-brand-800";
  return "bg-slate-100 text-slate-700";
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

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { profile } = await getProfileForCurrentUser();
  const delivery = await getProgramDelivery(slug);

  if (!delivery || !profile) {
    redirect("/app/programs");
  }

  const firstIncompleteLesson =
    delivery.modules.flatMap((module) => module.lessons).find((lesson) => lesson.status !== "completed") ??
    delivery.modules[0]?.lessons[0] ??
    null;

  return (
    <AppShell
      role={profile.role}
      title={delivery.title}
      description="Protected program delivery now includes structured modules, lesson progression, protected resources, and enrollment-aware access for students, parents, and admins."
    >
      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Progress" value={`${delivery.progressPercent}%`} detail={`${delivery.completedLessonCount} of ${delivery.lessonCount} lessons completed.`} />
        <MetricCard label="Modules" value={String(delivery.modules.length)} detail="Structured program sections for a clearer learning path." />
        <MetricCard label="Resources" value={String(delivery.resources.length)} detail="Protected files and guided links available with access." />
        <MetricCard label="Access" value={delivery.accessSource === "direct" ? "Direct" : delivery.accessSource === "linked-child" ? "Linked" : "Admin"} detail={delivery.accessLabel} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.34fr,0.66fr]">
        <DashboardSection
          title="Program roadmap"
          description="Move through modules in order, jump into the next lesson, and keep resources close to the active work."
          className="h-fit"
        >
          <div className="space-y-5">
            <div className="rounded-[1.5rem] bg-brand-700 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Recommended next step</p>
              <h3 className="mt-3 text-xl font-semibold">
                {firstIncompleteLesson ? firstIncompleteLesson.title : "Program completed"}
              </h3>
              <p className="mt-2 text-sm text-blue-50">
                {firstIncompleteLesson
                  ? "Use the lesson links below to continue where the learner left off."
                  : "All published lessons are marked complete for this learner context."}
              </p>
              {firstIncompleteLesson ? (
                <a
                  href={`#lesson-${firstIncompleteLesson.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-brand-800"
                >
                  Continue learning
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>

            {delivery.modules.length === 0 ? (
              <EmptyState
                title="No modules published yet"
                description="An administrator still needs to add module and lesson content to this program."
              />
            ) : (
              delivery.modules.map((module) => (
                <div key={module.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
                      <Layers3 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-ink">{module.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {module.lessons.length === 0 ? (
                      <p className="text-sm text-slate-500">No published lessons in this module yet.</p>
                    ) : (
                      module.lessons.map((lesson) => (
                        <a
                          key={lesson.id}
                          href={`#lesson-${lesson.id}`}
                          className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-900"
                        >
                          <span>{lesson.title}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(lesson.status)}`}>
                            {getStatusLabel(lesson.status)}
                          </span>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardSection>

        <div className="space-y-6">
          <DashboardSection
            title="Program overview"
            description="A premium learner experience that combines curriculum structure, guided progress, and protected resources in one place."
          >
            <div className="rounded-[1.75rem] bg-slate-50 p-6">
              <p className="text-sm leading-7 text-slate-700">{delivery.description}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <GraduationCap className="h-4 w-4 text-brand-700" />
                  {delivery.accessLabel}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {delivery.completedLessonCount} lessons completed
                </div>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Program resources"
            description="Resources can be scoped to the whole program or to a specific lesson, and protected file links are signed on demand."
          >
            {delivery.resources.length === 0 ? (
              <EmptyState
                title="No resources published yet"
                description="As program resources are added, learners will see them here alongside their lessons."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {delivery.resources.map((resource) => (
                  <article key={resource.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-ink">{resource.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {resource.resourceType === "file" ? "Protected file" : "Link"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {resource.lessonId ? "Lesson resource" : resource.moduleId ? "Module resource" : "Program resource"}
                    </p>
                    {resource.downloadUrl ? (
                      <Link
                        href={resource.downloadUrl}
                        target="_blank"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                      >
                        {resource.resourceType === "file" ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                        {resource.resourceType === "file" ? "Download resource" : "Open resource"}
                      </Link>
                    ) : (
                      <p className="mt-4 text-sm text-amber-700">This resource is not available yet.</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Lessons"
            description="Each lesson includes structured guidance and, for directly enrolled students, personal progress tracking."
          >
            {delivery.modules.length === 0 ? (
              <EmptyState
                title="No lesson content published yet"
                description="Administrators can add modules and lessons from the admin dashboard."
              />
            ) : (
              <div className="space-y-5">
                {delivery.modules.map((module) => (
                  <div key={module.id} className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Module</p>
                      <h3 className="mt-2 text-2xl font-semibold text-ink">{module.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                    </div>
                    {module.lessons.length === 0 ? (
                      <EmptyState title="No lessons in this module yet" description="Once lessons are published, they will appear here." />
                    ) : (
                      module.lessons.map((lesson) => {
                        const lessonResources = delivery.resources.filter((resource) => resource.lessonId === lesson.id);

                        return (
                          <article key={lesson.id} id={`lesson-${lesson.id}`} className="rounded-[1.5rem] border border-slate-200 p-5 scroll-mt-24">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <h4 className="text-xl font-semibold text-ink">{lesson.title}</h4>
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(lesson.status)}`}>
                                    {getStatusLabel(lesson.status)}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{lesson.summary}</p>
                              </div>
                              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                                <Clock3 className="h-4 w-4" />
                                {lesson.estimatedMinutes} min
                              </div>
                            </div>

                            <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-5">
                              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <BookOpenText className="h-4 w-4 text-brand-700" />
                                Lesson guidance
                              </div>
                              <div className="whitespace-pre-line text-sm leading-7 text-slate-700">{lesson.content}</div>
                            </div>

                            <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
                              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                  <NotebookPen className="h-4 w-4 text-brand-700" />
                                  Reflection
                                </div>
                                {delivery.canTrackProgress ? (
                                  <LessonReflectionForm slug={delivery.slug} lessonId={lesson.id} defaultValue={lesson.reflectionNote} />
                                ) : lesson.reflectionNote ? (
                                  <div className="space-y-2">
                                    <p className="text-sm leading-7 text-slate-700">{lesson.reflectionNote}</p>
                                    <p className="text-xs text-slate-500">Saved by the learner for this lesson.</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500">
                                    {delivery.accessSource === "linked-child"
                                      ? "The learner has not saved a reflection for this lesson yet."
                                      : "Admin preview mode does not include learner-authored reflections."}
                                  </p>
                                )}
                              </div>

                              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                                <p className="text-sm font-semibold text-slate-700">Lesson execution</p>
                                <p className="mt-2 text-sm text-slate-600">
                                  {lesson.tasks.length > 0
                                    ? `${lesson.tasks.filter((task) => task.status === "completed").length} of ${lesson.tasks.length} tasks completed.`
                                    : "This lesson does not have required execution tasks yet."}
                                </p>
                                {lesson.tasks.length === 0 && delivery.canTrackProgress ? (
                                  <div className="mt-5 flex flex-wrap gap-3">
                                    {lesson.status === "not_started" ? (
                                      <LessonProgressButton slug={delivery.slug} lessonId={lesson.id} status="in_progress" label="Mark in progress" />
                                    ) : null}
                                    {lesson.status !== "completed" ? (
                                      <LessonProgressButton slug={delivery.slug} lessonId={lesson.id} status="completed" label="Mark complete" />
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {lessonResources.length > 0 ? (
                              <div className="mt-4 rounded-[1.5rem] bg-brand-50 p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Lesson resources</p>
                                <div className="mt-3 space-y-3">
                                  {lessonResources.map((resource) => (
                                    <div key={resource.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                                      <div>
                                        <p className="text-sm font-semibold text-ink">{resource.title}</p>
                                        <p className="mt-1 text-sm text-slate-600">{resource.description}</p>
                                      </div>
                                      {resource.downloadUrl ? (
                                        <Link
                                          href={resource.downloadUrl}
                                          target="_blank"
                                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900"
                                        >
                                          {resource.resourceType === "file" ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                                          Open
                                        </Link>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            <div className="mt-4 space-y-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Lesson tasks</p>
                                <p className="mt-2 text-sm text-slate-600">
                                  Tasks connect lesson work to real submissions, teacher review, and feedback when needed.
                                </p>
                              </div>
                              {lesson.tasks.length === 0 ? (
                                <EmptyState
                                  title="No lesson tasks yet"
                                  description="This lesson currently relies on the lesson content and reflection space, without additional checkpoints or submissions."
                                />
                              ) : (
                                lesson.tasks.map((task) => (
                                  <div key={task.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                          <h5 className="text-lg font-semibold text-ink">{task.title}</h5>
                                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTaskStatusClasses(task.status)}`}>
                                            {getTaskStatusLabel(task.status)}
                                          </span>
                                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            {task.taskType === "submission" ? "Submission task" : "Checkpoint"}
                                          </span>
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{task.instructions}</p>
                                        {task.dueDate ? <p className="mt-2 text-sm text-slate-500">Due: {task.dueDate}</p> : null}
                                      </div>
                                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {task.isRequired ? "Required" : "Optional"}
                                      </span>
                                    </div>

                                    {task.responseText ? (
                                      <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Latest learner response</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">{task.responseText}</p>
                                      </div>
                                    ) : null}

                                    {task.latestSubmissionText ? (
                                      <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Latest submission</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">{task.latestSubmissionText}</p>
                                        <div className="mt-3">
                                          <SubmissionFileList files={task.files} emptyLabel="No files were attached to this task submission." />
                                        </div>
                                      </div>
                                    ) : null}

                                    <div className="mt-4 rounded-[1.25rem] bg-brand-50 p-4">
                                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Teacher feedback</p>
                                      {task.latestFeedbackComment ? (
                                        <>
                                          <p className="mt-2 text-sm leading-6 text-brand-900">{task.latestFeedbackComment}</p>
                                          <p className="mt-3 text-sm font-semibold text-brand-900">
                                            {task.latestFeedbackTeacher} | {task.latestFeedbackScore?.toFixed(1)}/10
                                          </p>
                                        </>
                                      ) : (
                                        <p className="mt-2 text-sm text-brand-900">No teacher feedback has been added for this task yet.</p>
                                      )}
                                    </div>

                                    {delivery.canTrackProgress ? (
                                      <div className="mt-4">
                                        {task.taskType === "checkpoint" ? (
                                          <LessonCheckpointForm
                                            slug={delivery.slug}
                                            lessonId={lesson.id}
                                            taskId={task.id}
                                            defaultValue={task.responseText}
                                          />
                                        ) : (
                                          <LessonTaskSubmissionForm slug={delivery.slug} lessonId={lesson.id} taskId={task.id} />
                                        )}
                                      </div>
                                    ) : (
                                      <p className="mt-4 text-sm text-slate-500">
                                        {delivery.accessSource === "linked-child"
                                          ? "This task is shown in read-only mode because progress belongs to the linked learner account."
                                          : "Admin preview mode shows execution state without allowing learner submissions."}
                                      </p>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>
    </AppShell>
  );
}
