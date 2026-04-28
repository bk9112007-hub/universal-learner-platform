"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { syncLessonProgressForUser } from "@/lib/programs/progress";
import { ensureProjectWorkspaceSeedFromBrief } from "@/lib/projects/workspace";
import { getSubmissionBucket, sanitizeFileName } from "@/lib/storage/files";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  error?: string;
  success?: string;
};

const MAX_FILES = 3;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const createProjectSchema = z.object({
  personalizedBriefId: z.string().uuid().optional(),
  title: z.string().min(3).max(120),
  subject: z.string().min(2).max(80),
  description: z.string().min(10).max(1200),
  submissionText: z.string().min(10).max(3000)
});

const feedbackSchema = z.object({
  submissionId: z.string().uuid(),
  projectId: z.string().uuid(),
  studentId: z.string().uuid(),
  score: z.coerce.number().min(0).max(10),
  comment: z.string().min(10).max(2000)
});

export async function createProjectSubmissionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createProjectSchema.safeParse({
    personalizedBriefId: formData.get("personalizedBriefId") || undefined,
    title: formData.get("title"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    submissionText: formData.get("submissionText")
  });

  if (!parsed.success) {
    return { error: "Please complete all project fields before submitting." };
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

  const { profile, user } = await getProfileForCurrentUser();
  if (!user || !profile || profile.role !== "student") {
    return { error: "Only students can submit projects." };
  }

  const supabase = await createClient();
  let projectId: string | null = null;

  if (parsed.data.personalizedBriefId) {
    const { data: existingProject, error: existingProjectError } = await supabase
      .from("projects")
      .select("id")
      .eq("student_id", user.id)
      .eq("personalized_brief_id", parsed.data.personalizedBriefId)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (existingProjectError) {
      return { error: existingProjectError.message };
    }

    if (existingProject?.id) {
      projectId = existingProject.id;
      const { error: projectUpdateError } = await supabase
        .from("projects")
        .update({
          title: parsed.data.title,
          subject: parsed.data.subject,
          description: parsed.data.description,
          status: "submitted"
        })
        .eq("id", projectId);

      if (projectUpdateError) {
        return { error: projectUpdateError.message };
      }
    }
  }

  if (!projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        student_id: user.id,
        personalized_brief_id: parsed.data.personalizedBriefId ?? null,
        title: parsed.data.title,
        subject: parsed.data.subject,
        description: parsed.data.description,
        status: "submitted"
      })
      .select("id")
      .single();

    if (projectError || !project) {
      return { error: projectError?.message ?? "Unable to create the project." };
    }

    projectId = project.id;
  }

  if (parsed.data.personalizedBriefId && projectId) {
    try {
      await ensureProjectWorkspaceSeedFromBrief(projectId, parsed.data.personalizedBriefId, user.id);
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      project_id: projectId,
      student_id: user.id,
      submission_text: parsed.data.submissionText,
      status: "submitted"
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    return { error: submissionError.message };
  }

  const bucket = getSubmissionBucket();
  for (const file of uploadedFiles) {
    const storagePath = `${user.id}/${submission.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const uploadResult = await supabase.storage.from(bucket).upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false
    });

    if (uploadResult.error) {
      return { error: uploadResult.error.message };
    }

    const { error: fileRecordError } = await supabase.from("files").insert({
      owner_id: user.id,
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

  revalidatePath("/app/student");
  revalidatePath("/app/teacher");
  revalidatePath("/app/parent");
  revalidatePath(`/app/projects/${projectId}`);

  return {
    success:
      uploadedFiles.length > 0
        ? `Project submitted successfully with ${uploadedFiles.length} file${uploadedFiles.length === 1 ? "" : "s"}.`
        : "Project submitted successfully."
  };
}

export async function createTeacherFeedbackAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = feedbackSchema.safeParse({
    submissionId: formData.get("submissionId"),
    projectId: formData.get("projectId"),
    studentId: formData.get("studentId"),
    score: formData.get("score"),
    comment: formData.get("comment")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid score and feedback comment." };
  }

  const { profile, user } = await getProfileForCurrentUser();
  if (!user || !profile || !["teacher", "admin"].includes(profile.role)) {
    return { error: "Only teachers and admins can leave feedback." };
  }

  const supabase = await createClient();
  const nextStatus = parsed.data.score >= 7 ? "reviewed" : "needs_revision";
  const taskNextStatus = parsed.data.score >= 7 ? "completed" : "needs_revision";

  const { error: feedbackError } = await supabase.from("feedback").insert({
    project_id: parsed.data.projectId,
    submission_id: parsed.data.submissionId,
    student_id: parsed.data.studentId,
    teacher_id: user.id,
    teacher_name: profile.full_name ?? "Teacher",
    score: parsed.data.score,
    comment: parsed.data.comment
  });

  if (feedbackError) {
    return { error: feedbackError.message };
  }

  const [{ error: projectUpdateError }, { error: submissionUpdateError }] = await Promise.all([
    supabase.from("projects").update({ status: nextStatus }).eq("id", parsed.data.projectId),
    supabase.from("submissions").update({ status: nextStatus }).eq("id", parsed.data.submissionId)
  ]);

  if (projectUpdateError) {
    return { error: projectUpdateError.message };
  }
  if (submissionUpdateError) {
    return { error: submissionUpdateError.message };
  }

  const { data: projectContext, error: projectContextError } = await supabase
    .from("projects")
    .select("program_id, lesson_id, lesson_task_id")
    .eq("id", parsed.data.projectId)
    .single();

  if (projectContextError) {
    return { error: projectContextError.message };
  }

  if (projectContext?.program_id && projectContext?.lesson_id && projectContext?.lesson_task_id) {
    const adminSupabase = createAdminClient();
    const { error: taskProgressError } = await adminSupabase
      .from("lesson_task_progress")
      .update({
        status: taskNextStatus,
        completed_at: taskNextStatus === "completed" ? new Date().toISOString() : null
      })
      .eq("user_id", parsed.data.studentId)
      .eq("task_id", projectContext.lesson_task_id);

    if (taskProgressError) {
      return { error: taskProgressError.message };
    }

    await syncLessonProgressForUser({
      userId: parsed.data.studentId,
      programId: projectContext.program_id,
      lessonId: projectContext.lesson_id
    });
  }

  const adminSupabase = createAdminClient();
  const { data: projectTaskProgress, error: projectTaskProgressError } = await adminSupabase
    .from("project_task_progress")
    .select("id, project_id")
    .eq("submission_id", parsed.data.submissionId)
    .maybeSingle();

  if (projectTaskProgressError) {
    return { error: projectTaskProgressError.message };
  }

  if (projectTaskProgress?.id) {
    const { error: workspaceProgressUpdateError } = await adminSupabase
      .from("project_task_progress")
      .update({
        status: taskNextStatus,
        completed_at: taskNextStatus === "completed" ? new Date().toISOString() : null
      })
      .eq("id", projectTaskProgress.id);

    if (workspaceProgressUpdateError) {
      return { error: workspaceProgressUpdateError.message };
    }
  }

  revalidatePath("/app/student");
  revalidatePath("/app/teacher");
  revalidatePath("/app/parent");
  revalidatePath(`/app/projects/${parsed.data.projectId}`);
  if (projectContext?.program_id) {
    revalidatePath("/app/programs");
  }

  return { success: "Feedback sent to the student dashboard." };
}
