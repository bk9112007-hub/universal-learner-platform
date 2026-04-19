"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { syncLessonProgressForUser } from "@/lib/programs/progress";
import { getProgramAccessContext } from "@/lib/programs/delivery";
import { getSubmissionBucket, sanitizeFileName } from "@/lib/storage/files";
import { createClient } from "@/lib/supabase/server";

export type ProgramProgressActionState = {
  error?: string;
  success?: string;
};

const MAX_FILES = 3;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const lessonProgressSchema = z.object({
  slug: z.string().min(1),
  lessonId: z.string().uuid(),
  status: z.enum(["in_progress", "completed"])
});

const reflectionSchema = z.object({
  slug: z.string().min(1),
  lessonId: z.string().uuid(),
  note: z.string().min(10).max(4000)
});

const checkpointSchema = z.object({
  slug: z.string().min(1),
  lessonId: z.string().uuid(),
  taskId: z.string().uuid(),
  responseText: z.string().max(3000).optional()
});

const lessonSubmissionSchema = z.object({
  slug: z.string().min(1),
  lessonId: z.string().uuid(),
  taskId: z.string().uuid(),
  submissionText: z.string().min(10).max(4000)
});

async function requireDirectStudentProgramAccess(slug: string) {
  const context = await getProgramAccessContext(slug);
  if (!context.allowed || !context.program || !context.profile) {
    throw new Error("Program access could not be confirmed.");
  }
  if (!(context.profile.role === "student" && context.accessSource === "direct" && context.accessUserId)) {
    throw new Error("Only directly enrolled students can update this program.");
  }

  return context;
}

function revalidateProgramSurfaces(slug: string) {
  revalidatePath(`/app/programs/${slug}`);
  revalidatePath("/app/student");
  revalidatePath("/app/parent");
  revalidatePath("/app/teacher");
  revalidatePath("/app/onboarding");
}

export async function updateLessonProgressAction(
  _: ProgramProgressActionState,
  formData: FormData
): Promise<ProgramProgressActionState> {
  const parsed = lessonProgressSchema.safeParse({
    slug: formData.get("slug"),
    lessonId: formData.get("lessonId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { error: "Invalid lesson progress update." };
  }

  let context;
  try {
    context = await requireDirectStudentProgramAccess(parsed.data.slug);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { data: tasks, error: tasksError } = await supabase.from("lesson_tasks").select("id").eq("lesson_id", parsed.data.lessonId);
  if (tasksError) {
    return { error: tasksError.message };
  }
  if ((tasks ?? []).length > 0 && parsed.data.status === "completed") {
    return { error: "Complete the lesson tasks first. Lessons with task work are completed through execution progress." };
  }

  const { error } = await supabase.from("user_lesson_progress").upsert(
    {
      user_id: context.accessUserId!,
      program_id: context.program.id,
      lesson_id: parsed.data.lessonId,
      status: parsed.data.status,
      last_viewed_at: new Date().toISOString(),
      completed_at: parsed.data.status === "completed" ? new Date().toISOString() : null
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidateProgramSurfaces(parsed.data.slug);
  return { success: parsed.data.status === "completed" ? "Lesson marked complete." : "Lesson progress saved." };
}

export async function saveLessonReflectionAction(
  _: ProgramProgressActionState,
  formData: FormData
): Promise<ProgramProgressActionState> {
  const parsed = reflectionSchema.safeParse({
    slug: formData.get("slug"),
    lessonId: formData.get("lessonId"),
    note: formData.get("note")
  });

  if (!parsed.success) {
    return { error: "Please write a reflection before saving." };
  }

  let context;
  try {
    context = await requireDirectStudentProgramAccess(parsed.data.slug);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_reflections").upsert(
    {
      user_id: context.accessUserId!,
      program_id: context.program.id,
      lesson_id: parsed.data.lessonId,
      note: parsed.data.note
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) {
    return { error: error.message };
  }

  const { error: progressError } = await supabase.from("user_lesson_progress").upsert(
    {
      user_id: context.accessUserId!,
      program_id: context.program.id,
      lesson_id: parsed.data.lessonId,
      status: "in_progress",
      last_viewed_at: new Date().toISOString()
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (progressError) {
    return { error: progressError.message };
  }

  revalidateProgramSurfaces(parsed.data.slug);
  return { success: "Reflection saved." };
}

export async function completeCheckpointTaskAction(
  _: ProgramProgressActionState,
  formData: FormData
): Promise<ProgramProgressActionState> {
  const parsed = checkpointSchema.safeParse({
    slug: formData.get("slug"),
    lessonId: formData.get("lessonId"),
    taskId: formData.get("taskId"),
    responseText: (formData.get("responseText") || "").toString()
  });

  if (!parsed.success) {
    return { error: "Please provide a valid task response." };
  }

  let context;
  try {
    context = await requireDirectStudentProgramAccess(parsed.data.slug);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("lesson_tasks")
    .select("id, task_type")
    .eq("id", parsed.data.taskId)
    .eq("lesson_id", parsed.data.lessonId)
    .single();

  if (taskError || !task) {
    return { error: taskError?.message ?? "Task not found." };
  }
  if (task.task_type !== "checkpoint") {
    return { error: "Only checkpoint tasks can be completed from this action." };
  }

  const { error } = await supabase.from("lesson_task_progress").upsert(
    {
      user_id: context.accessUserId,
      program_id: context.program.id,
      lesson_id: parsed.data.lessonId,
      task_id: parsed.data.taskId,
      status: "completed",
      response_text: parsed.data.responseText?.trim() || null,
      completed_at: new Date().toISOString()
    },
    { onConflict: "user_id,task_id" }
  );

  if (error) {
    return { error: error.message };
  }

  await syncLessonProgressForUser({
    userId: context.accessUserId!,
    programId: context.program.id,
    lessonId: parsed.data.lessonId
  });

  revalidateProgramSurfaces(parsed.data.slug);
  return { success: "Checkpoint completed." };
}

export async function submitLessonTaskAction(
  _: ProgramProgressActionState,
  formData: FormData
): Promise<ProgramProgressActionState> {
  const parsed = lessonSubmissionSchema.safeParse({
    slug: formData.get("slug"),
    lessonId: formData.get("lessonId"),
    taskId: formData.get("taskId"),
    submissionText: formData.get("submissionText")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid lesson task submission." };
  }

  const uploadedFiles = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (uploadedFiles.length > MAX_FILES) {
    return { error: `Please upload no more than ${MAX_FILES} files.` };
  }
  if (uploadedFiles.some((file) => file.size > MAX_FILE_SIZE_BYTES)) {
    return { error: "Each file must be 10 MB or smaller." };
  }

  let context;
  try {
    context = await requireDirectStudentProgramAccess(parsed.data.slug);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("lesson_tasks")
    .select(
      `
      id,
      title,
      task_type,
      lesson_id,
      program_lessons (
        title,
        program_id,
        program_modules (
          title
        )
      )
    `
    )
    .eq("id", parsed.data.taskId)
    .eq("lesson_id", parsed.data.lessonId)
    .single();

  if (taskError || !task) {
    return { error: taskError?.message ?? "Lesson task not found." };
  }
  if (task.task_type !== "submission") {
    return { error: "Only submission tasks can be submitted with this action." };
  }

  const lesson = Array.isArray((task as any).program_lessons) ? (task as any).program_lessons[0] : (task as any).program_lessons;
  const module = Array.isArray(lesson?.program_modules) ? lesson.program_modules[0] : lesson?.program_modules;

  const { data: existingTaskProgress, error: existingProgressError } = await supabase
    .from("lesson_task_progress")
    .select("project_id")
    .eq("user_id", context.accessUserId!)
    .eq("task_id", parsed.data.taskId)
    .maybeSingle();

  if (existingProgressError) {
    return { error: existingProgressError.message };
  }

  let projectId = existingTaskProgress?.project_id ?? null;
  if (!projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        student_id: context.accessUserId!,
        program_id: context.program.id,
        lesson_id: parsed.data.lessonId,
        lesson_task_id: parsed.data.taskId,
        title: `${context.program.title}: ${task.title}`,
        subject: module?.title ?? lesson?.title ?? "Program lesson",
        description: `Lesson task submission for ${lesson?.title ?? "lesson"}`
      })
      .select("id")
      .single();

    if (projectError || !project) {
      return { error: projectError?.message ?? "Unable to create the lesson task project." };
    }

    projectId = project.id;
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      project_id: projectId,
      student_id: context.accessUserId!,
      submission_text: parsed.data.submissionText,
      status: "submitted"
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    return { error: submissionError?.message ?? "Unable to create the lesson task submission." };
  }

  const bucket = getSubmissionBucket();
  for (const file of uploadedFiles) {
    const storagePath = `${context.accessUserId}/${submission.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const uploadResult = await supabase.storage.from(bucket).upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false
    });

    if (uploadResult.error) {
      return { error: uploadResult.error.message };
    }

    const { error: fileRecordError } = await supabase.from("files").insert({
      owner_id: context.accessUserId!,
      project_id: projectId,
      submission_id: submission.id,
      bucket,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || null
    });

    if (fileRecordError) {
      return { error: fileRecordError.message };
    }
  }

  const { error: progressError } = await supabase.from("lesson_task_progress").upsert(
    {
      user_id: context.accessUserId!,
      program_id: context.program.id,
      lesson_id: parsed.data.lessonId,
      task_id: parsed.data.taskId,
      status: "submitted",
      response_text: parsed.data.submissionText,
      project_id: projectId,
      completed_at: null
    },
    { onConflict: "user_id,task_id" }
  );

  if (progressError) {
    return { error: progressError.message };
  }

  await syncLessonProgressForUser({
    userId: context.accessUserId!,
    programId: context.program.id,
    lessonId: parsed.data.lessonId
  });

  revalidateProgramSurfaces(parsed.data.slug);
  return {
    success:
      uploadedFiles.length > 0
        ? `Task submitted with ${uploadedFiles.length} file${uploadedFiles.length === 1 ? "" : "s"}.`
        : "Task submitted for teacher review."
  };
}
