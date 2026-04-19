"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ProgramDeliveryRecord, ProgramLessonRecord, ProgramResourceRecord, SubmissionFileRecord } from "@/types/domain";

type ProgramAccessContext = {
  allowed: boolean;
  program: any | null;
  profile: any | null;
  accessUserId: string | null;
  accessSource: "direct" | "linked-child" | "admin" | null;
  accessLabel: string;
};

export async function getProgramAccessContext(slug: string): Promise<ProgramAccessContext> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, program: null, profile: null, accessUserId: null, accessSource: null, accessLabel: "" };
  }

  const [{ data: program, error: programError }, { data: profile, error: profileError }] = await Promise.all([
    supabase
      .from("programs")
      .select("id, title, slug, description, price_cents, shopify_product_id, is_active")
      .eq("slug", slug)
      .single(),
    supabase.from("profiles").select("id, full_name, role").eq("id", user.id).single()
  ]);

  if (programError || !program || profileError || !profile) {
    return { allowed: false, program: null, profile: null, accessUserId: null, accessSource: null, accessLabel: "" };
  }

  if (!program.is_active && profile.role !== "admin") {
    return { allowed: false, program, profile, accessUserId: null, accessSource: null, accessLabel: "" };
  }

  if (profile.role === "admin") {
    return {
      allowed: true,
      program,
      profile,
      accessUserId: user.id,
      accessSource: "admin" as const,
      accessLabel: "Admin preview access"
    };
  }

  const { data: ownEnrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", program.id)
    .eq("status", "active")
    .maybeSingle();

  if (ownEnrollment) {
    return {
      allowed: true,
      program,
      profile,
      accessUserId: user.id,
      accessSource: "direct" as const,
      accessLabel: "Unlocked for this account"
    };
  }

  if (profile.role === "parent") {
    const { data: links } = await supabase.from("parent_student_links").select("student_id").eq("parent_id", user.id);
    const studentIds = (links ?? []).map((link: any) => link.student_id);

    if (studentIds.length > 0) {
      const { data: childEnrollments } = await supabase
        .from("enrollments")
        .select("user_id")
        .eq("program_id", program.id)
        .eq("status", "active")
        .in("user_id", studentIds);

      if ((childEnrollments ?? []).length > 0) {
        const childUserId = childEnrollments![0].user_id;
        const { data: childProfile } = await supabase.from("profiles").select("full_name").eq("id", childUserId).single();

        return {
          allowed: true,
          program,
          profile,
          accessUserId: childUserId,
          accessSource: "linked-child" as const,
          accessLabel: `Visible through ${childProfile?.full_name ?? "linked child"}`
        };
      }
    }
  }

  return { allowed: false, program, profile, accessUserId: null, accessSource: null, accessLabel: "" };
}

export async function getProgramDelivery(slug: string): Promise<ProgramDeliveryRecord | null> {
  const context = await getProgramAccessContext(slug);
  if (!context.allowed || !context.program || !context.accessUserId || !context.accessSource) {
    return null;
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const [
    { data: modules, error: modulesError },
    { data: lessons, error: lessonsError },
    { data: tasks, error: tasksError },
    { data: resources, error: resourcesError },
    { data: progress, error: progressError },
    { data: reflections, error: reflectionsError },
    { data: taskProgress, error: taskProgressError },
    { data: taskProjects, error: taskProjectsError }
  ] = await Promise.all([
    supabase
      .from("program_modules")
      .select("id, title, description, sort_order")
      .eq("program_id", context.program.id)
      .order("sort_order"),
    supabase
      .from("program_lessons")
      .select("id, module_id, title, summary, content, sort_order, estimated_minutes, is_published")
      .eq("program_id", context.program.id)
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("lesson_tasks")
      .select("id, lesson_id, title, instructions, task_type, sort_order, is_required, due_date")
      .order("sort_order"),
    supabase
      .from("program_resources")
      .select("id, module_id, lesson_id, title, description, resource_type, external_url, bucket, storage_path, file_name")
      .eq("program_id", context.program.id)
      .eq("is_published", true)
      .order("created_at"),
    supabase
      .from("user_lesson_progress")
      .select("lesson_id, status, completed_at")
      .eq("program_id", context.program.id)
      .eq("user_id", context.accessUserId),
    supabase
      .from("lesson_reflections")
      .select("lesson_id, note, updated_at")
      .eq("program_id", context.program.id)
      .eq("user_id", context.accessUserId),
    supabase
      .from("lesson_task_progress")
      .select("task_id, lesson_id, status, response_text, project_id")
      .eq("program_id", context.program.id)
      .eq("user_id", context.accessUserId),
    supabase
      .from("projects")
      .select(
        `
        id,
        lesson_task_id,
        submissions (
          id,
          submission_text,
          submitted_at,
          feedback (
            teacher_name,
            score,
            comment,
            created_at
          ),
          files (
            id,
            file_name,
            mime_type,
            storage_path,
            bucket
          )
        )
      `
      )
      .eq("student_id", context.accessUserId)
      .eq("program_id", context.program.id)
      .not("lesson_task_id", "is", null)
  ]);

  if (modulesError) throw new Error(modulesError.message);
  if (lessonsError) throw new Error(lessonsError.message);
  if (tasksError) throw new Error(tasksError.message);
  if (resourcesError) throw new Error(resourcesError.message);
  if (progressError) throw new Error(progressError.message);
  if (reflectionsError) throw new Error(reflectionsError.message);
  if (taskProgressError) throw new Error(taskProgressError.message);
  if (taskProjectsError) throw new Error(taskProjectsError.message);

  const fileResources = (resources ?? []).filter((resource: any) => resource.resource_type === "file" && resource.bucket && resource.storage_path);
  const taskSubmissionFiles = (taskProjects ?? [])
    .flatMap((project: any) => (Array.isArray(project.submissions) ? project.submissions : []))
    .flatMap((submission: any) => (Array.isArray(submission.files) ? submission.files : []))
    .filter((file: any) => file.bucket && file.storage_path);
  const signedUrlMap = new Map<string, string | null>();

  await Promise.all(
    [...fileResources, ...taskSubmissionFiles].map(async (resourceOrFile: any) => {
      const { data } = await adminSupabase.storage.from(resourceOrFile.bucket).createSignedUrl(resourceOrFile.storage_path, 60 * 30);
      signedUrlMap.set(resourceOrFile.id, data?.signedUrl ?? null);
    })
  );

  const progressMap = new Map<string, { status: ProgramLessonRecord["status"]; completedAt: string | null }>(
    (progress ?? []).map((entry: any) => [entry.lesson_id, { status: entry.status, completedAt: entry.completed_at }])
  );
  const reflectionMap = new Map<string, { note: string; updatedAt: string }>(
    (reflections ?? []).map((entry: any) => [entry.lesson_id, { note: entry.note, updatedAt: entry.updated_at }])
  );
  const taskProgressMap = new Map<string, any>((taskProgress ?? []).map((entry: any) => [entry.task_id, entry]));
  const taskProjectMap = new Map<string, any>((taskProjects ?? []).map((project: any) => [project.lesson_task_id, project]));

  function formatSubmissionFiles(files: any[]): SubmissionFileRecord[] {
    return files.map((file: any) => ({
      id: file.id,
      fileName: file.file_name,
      mimeType: file.mime_type ?? null,
      storagePath: file.storage_path,
      downloadUrl: signedUrlMap.get(file.id) ?? null
    }));
  }

  const rawLessonList: Array<ProgramLessonRecord & { moduleId: string }> = (lessons ?? []).map((lesson: any) => ({
    id: lesson.id,
    moduleId: lesson.module_id,
    title: lesson.title,
    summary: lesson.summary,
    content: lesson.content,
    sortOrder: lesson.sort_order,
    estimatedMinutes: lesson.estimated_minutes,
    isPublished: lesson.is_published,
    status: progressMap.get(lesson.id)?.status ?? "not_started",
    completedAt: progressMap.get(lesson.id)?.completedAt ?? null,
    reflectionNote: reflectionMap.get(lesson.id)?.note ?? null,
    reflectionUpdatedAt: reflectionMap.get(lesson.id)?.updatedAt ?? null,
    tasks: (tasks ?? [])
      .filter((task: any) => task.lesson_id === lesson.id)
      .map((task: any) => {
        const progressEntry = taskProgressMap.get(task.id);
        const taskProject = taskProjectMap.get(task.id);
        const submissions = Array.isArray(taskProject?.submissions) ? taskProject.submissions : [];
        const latestSubmission = [...submissions].sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at))[0];
        const feedbackEntries = Array.isArray(latestSubmission?.feedback) ? latestSubmission.feedback : [];
        const latestFeedback = [...feedbackEntries].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
        const submissionFiles = Array.isArray(latestSubmission?.files) ? formatSubmissionFiles(latestSubmission.files) : [];

        return {
          id: task.id,
          title: task.title,
          instructions: task.instructions,
          taskType: task.task_type,
          sortOrder: task.sort_order,
          isRequired: task.is_required,
          dueDate: task.due_date,
          status: progressEntry?.status ?? "not_started",
          responseText: progressEntry?.response_text ?? null,
          submissionProjectId: progressEntry?.project_id ?? taskProject?.id ?? null,
          latestSubmissionText: latestSubmission?.submission_text ?? null,
          latestFeedbackComment: latestFeedback?.comment ?? null,
          latestFeedbackScore: latestFeedback?.score ?? null,
          latestFeedbackTeacher: latestFeedback?.teacher_name ?? null,
          files: submissionFiles
        };
      })
      .sort(
        (
          a: {
            sortOrder: number;
          },
          b: {
            sortOrder: number;
          }
        ) => a.sortOrder - b.sortOrder
      )
  }));

  const lessonList: ProgramLessonRecord[] = rawLessonList.map(({ moduleId: _moduleId, ...lesson }: ProgramLessonRecord & { moduleId: string }) => lesson);

  const resourceList: ProgramResourceRecord[] = (resources ?? []).map((resource: any) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description,
    resourceType: resource.resource_type,
    externalUrl: resource.external_url,
    fileName: resource.file_name,
    downloadUrl: resource.resource_type === "file" ? signedUrlMap.get(resource.id) ?? null : resource.external_url,
    lessonId: resource.lesson_id,
    moduleId: resource.module_id
  }));

  const moduleList = (modules ?? []).map((module: any) => ({
    id: module.id,
    title: module.title,
    description: module.description,
    sortOrder: module.sort_order,
    lessons: rawLessonList
      .filter((lesson: ProgramLessonRecord & { moduleId: string }) => lesson.moduleId === module.id)
      .map(({ moduleId: _moduleId, ...lesson }: ProgramLessonRecord & { moduleId: string }) => lesson)
  }));

  const completedLessonCount = lessonList.filter((lesson) => lesson.status === "completed").length;
  const lessonCount = lessonList.length;
  const progressPercent = lessonCount > 0 ? Math.round((completedLessonCount / lessonCount) * 100) : 0;

  return {
    id: context.program.id,
    title: context.program.title,
    slug: context.program.slug,
    description: context.program.description,
    accessSource: context.accessSource,
    accessLabel: context.accessLabel,
    progressPercent,
    lessonCount,
    completedLessonCount,
    modules: moduleList,
    resources: resourceList,
    canTrackProgress: context.profile?.role === "student" && context.accessSource === "direct"
  };
}
