"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { getSubmissionBucket, sanitizeFileName } from "@/lib/storage/files";
import { createClient } from "@/lib/supabase/server";
import { ensureProjectWorkspaceSeedFromBrief, getProjectWorkspaceAccessContext } from "@/lib/projects/workspace";

export type ProjectWorkspaceActionState = {
  error?: string;
  success?: string;
};

const MAX_FILES = 3;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const launchWorkspaceSchema = z.object({
  briefId: z.string().uuid()
});

const reflectionSchema = z.object({
  projectId: z.string().uuid(),
  note: z.string().min(10).max(4000)
});

const checklistSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  responseText: z.string().max(3000).optional(),
  status: z.enum(["in_progress", "completed"])
});

const submissionSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  submissionText: z.string().min(10).max(4000)
});

const workspaceSummarySchema = z.object({
  projectId: z.string().uuid(),
  personalizedReason: z.string().max(3000).optional(),
  targetSkills: z.string().max(500).optional(),
  rubricText: z.string().max(4000).optional(),
  timelineText: z.string().max(4000).optional()
});

const milestoneSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().optional(),
  title: z.string().min(3).max(140),
  description: z.string().max(1000).optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
  dueDate: z.string().optional()
});

const taskSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(3).max(140),
  description: z.string().max(1200).optional(),
  taskType: z.enum(["checklist", "submission"]),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
  isRequired: z.enum(["true", "false"]).optional(),
  dueDate: z.string().optional()
});

const resourceSchema = z.object({
  projectId: z.string().uuid(),
  resourceId: z.string().uuid().optional(),
  title: z.string().min(3).max(140),
  description: z.string().max(1000).optional(),
  resourceType: z.enum(["link", "note"]),
  externalUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional()
});

function normalizeDate(value?: string) {
  return value && value.trim() ? value : null;
}

function parseDelimitedEntries(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseRubricLines(value?: string | null) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [criterion, ...descriptionParts] = line.split(":");
      return {
        criterion: criterion.trim(),
        description: descriptionParts.join(":").trim()
      };
    })
    .filter((entry) => entry.criterion);
}

function parseTimelineLines(value?: string | null) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...goalParts] = line.split(":");
      return {
        label: label.trim(),
        goal: goalParts.join(":").trim()
      };
    })
    .filter((entry) => entry.label);
}

function revalidateProjectWorkspace(projectId: string) {
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app/student");
  revalidatePath("/app/teacher");
  revalidatePath("/app/parent");
  revalidatePath("/app/admin");
}

async function requireStudentProjectAccess(projectId: string) {
  const context = await getProjectWorkspaceAccessContext(projectId);
  if (!context.allowed || !context.project || !context.profile || !context.canStudentEdit) {
    throw new Error("Only the assigned student can update this project workspace.");
  }

  return context;
}

async function requireTeacherProjectAccess(projectId: string) {
  const context = await getProjectWorkspaceAccessContext(projectId);
  if (!context.allowed || !context.project || !context.profile || !context.canTeacherManage) {
    throw new Error("Only the assigned teacher or an admin can manage this project workspace.");
  }

  return context;
}

export async function launchProjectWorkspaceAction(_: ProjectWorkspaceActionState, formData: FormData): Promise<ProjectWorkspaceActionState> {
  const parsed = launchWorkspaceSchema.safeParse({
    briefId: formData.get("briefId")
  });

  if (!parsed.success) {
    return { error: "A valid personalized project brief is required." };
  }

  const { profile, user } = await getProfileForCurrentUser();
  if (!user || !profile || profile.role !== "student") {
    return { error: "Only students can open a personalized project workspace." };
  }

  const supabase = await createClient();
  const { data: existingProject, error: existingProjectError } = await supabase
    .from("projects")
    .select("id")
    .eq("student_id", user.id)
    .eq("personalized_brief_id", parsed.data.briefId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (existingProjectError) {
    return { error: existingProjectError.message };
  }

  if (existingProject?.id) {
    redirect(`/app/projects/${existingProject.id}`);
  }

  const { data: briefAssignment, error: briefAssignmentError } = await supabase
    .from("personalized_project_brief_students")
    .select(
      `
      brief_id,
      personalized_project_briefs (
        title,
        subject,
        description
      )
    `
    )
    .eq("brief_id", parsed.data.briefId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (briefAssignmentError) {
    return { error: briefAssignmentError.message };
  }

  const brief =
    briefAssignment && Array.isArray((briefAssignment as any).personalized_project_briefs)
      ? (briefAssignment as any).personalized_project_briefs[0]
      : (briefAssignment as any)?.personalized_project_briefs;

  if (!brief) {
    return { error: "That personalized project brief is not assigned to this student." };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      student_id: user.id,
      personalized_brief_id: parsed.data.briefId,
      title: brief.title,
      subject: brief.subject,
      description: brief.description,
      status: "draft"
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return { error: projectError?.message ?? "Unable to create the project workspace." };
  }

  try {
    await ensureProjectWorkspaceSeedFromBrief(project.id, parsed.data.briefId, user.id);
  } catch (error) {
    return { error: (error as Error).message };
  }

  revalidateProjectWorkspace(project.id);
  redirect(`/app/projects/${project.id}`);
}

export async function saveProjectReflectionAction(
  _: ProjectWorkspaceActionState,
  formData: FormData
): Promise<ProjectWorkspaceActionState> {
  const parsed = reflectionSchema.safeParse({
    projectId: formData.get("projectId"),
    note: formData.get("note")
  });

  if (!parsed.success) {
    return { error: "Please write a reflection before saving." };
  }

  let context;
  try {
    context = await requireStudentProjectAccess(parsed.data.projectId);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_reflections").upsert(
    {
      project_id: parsed.data.projectId,
      user_id: context.project.student_id,
      note: parsed.data.note
    },
    { onConflict: "project_id,user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidateProjectWorkspace(parsed.data.projectId);
  return { success: "Reflection saved." };
}

export async function updateProjectChecklistTaskAction(
  _: ProjectWorkspaceActionState,
  formData: FormData
): Promise<ProjectWorkspaceActionState> {
  const parsed = checklistSchema.safeParse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    responseText: (formData.get("responseText") || "").toString(),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid checklist update." };
  }

  let context;
  try {
    context = await requireStudentProjectAccess(parsed.data.projectId);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("project_tasks")
    .select("id, task_type")
    .eq("id", parsed.data.taskId)
    .eq("project_id", parsed.data.projectId)
    .single();

  if (taskError || !task) {
    return { error: taskError?.message ?? "Task not found." };
  }
  if (task.task_type !== "checklist") {
    return { error: "Only checklist tasks can be updated here." };
  }

  const { error } = await supabase.from("project_task_progress").upsert(
    {
      project_id: parsed.data.projectId,
      task_id: parsed.data.taskId,
      user_id: context.project.student_id,
      status: parsed.data.status,
      response_text: parsed.data.responseText?.trim() || null,
      completed_at: parsed.data.status === "completed" ? new Date().toISOString() : null
    },
    { onConflict: "project_id,task_id,user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidateProjectWorkspace(parsed.data.projectId);
  return { success: parsed.data.status === "completed" ? "Task completed." : "Task progress updated." };
}

export async function submitProjectWorkspaceWorkAction(
  _: ProjectWorkspaceActionState,
  formData: FormData
): Promise<ProjectWorkspaceActionState> {
  const parsed = submissionSchema.safeParse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
    submissionText: formData.get("submissionText")
  });

  if (!parsed.success) {
    return { error: "Please provide the submission text before sending work." };
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
    context = await requireStudentProjectAccess(parsed.data.projectId);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("project_tasks")
    .select("id, task_type")
    .eq("id", parsed.data.taskId)
    .eq("project_id", parsed.data.projectId)
    .single();

  if (taskError || !task) {
    return { error: taskError?.message ?? "Project submission task not found." };
  }
  if (task.task_type !== "submission") {
    return { error: "Only submission tasks can accept uploaded work." };
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      project_id: parsed.data.projectId,
      student_id: context.project.student_id,
      submission_text: parsed.data.submissionText,
      status: "submitted"
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    return { error: submissionError?.message ?? "Unable to create the project submission." };
  }

  const bucket = getSubmissionBucket();
  for (const file of uploadedFiles) {
    const storagePath = `${context.project.student_id}/${submission.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const uploadResult = await supabase.storage.from(bucket).upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false
    });

    if (uploadResult.error) {
      return { error: uploadResult.error.message };
    }

    const { error: fileRecordError } = await supabase.from("files").insert({
      owner_id: context.project.student_id,
      project_id: parsed.data.projectId,
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

  const [{ error: taskProgressError }, { error: projectUpdateError }] = await Promise.all([
    supabase.from("project_task_progress").upsert(
      {
        project_id: parsed.data.projectId,
        task_id: parsed.data.taskId,
        user_id: context.project.student_id,
        status: "submitted",
        response_text: parsed.data.submissionText,
        submission_id: submission.id,
        completed_at: null
      },
      { onConflict: "project_id,task_id,user_id" }
    ),
    supabase.from("projects").update({ status: "submitted" }).eq("id", parsed.data.projectId)
  ]);

  if (taskProgressError) {
    return { error: taskProgressError.message };
  }
  if (projectUpdateError) {
    return { error: projectUpdateError.message };
  }

  revalidateProjectWorkspace(parsed.data.projectId);
  return {
    success:
      uploadedFiles.length > 0
        ? `Project work submitted with ${uploadedFiles.length} file${uploadedFiles.length === 1 ? "" : "s"}.`
        : "Project work submitted for teacher review."
  };
}

export async function saveProjectWorkspaceSummaryAction(
  _: ProjectWorkspaceActionState,
  formData: FormData
): Promise<ProjectWorkspaceActionState> {
  const parsed = workspaceSummarySchema.safeParse({
    projectId: formData.get("projectId"),
    personalizedReason: formData.get("personalizedReason"),
    targetSkills: formData.get("targetSkills"),
    rubricText: formData.get("rubricText"),
    timelineText: formData.get("timelineText")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid project overview update." };
  }

  try {
    await requireTeacherProjectAccess(parsed.data.projectId);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      personalized_reason: parsed.data.personalizedReason?.trim() || null,
      target_skills: parseDelimitedEntries(parsed.data.targetSkills),
      workspace_rubric: parseRubricLines(parsed.data.rubricText),
      workspace_timeline: parseTimelineLines(parsed.data.timelineText)
    })
    .eq("id", parsed.data.projectId);

  if (error) {
    return { error: error.message };
  }

  revalidateProjectWorkspace(parsed.data.projectId);
  return { success: "Project workspace overview updated." };
}

export async function saveProjectMilestoneAction(
  _: ProjectWorkspaceActionState,
  formData: FormData
): Promise<ProjectWorkspaceActionState> {
  const parsed = milestoneSchema.safeParse({
    projectId: formData.get("projectId"),
    milestoneId: formData.get("milestoneId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder") || undefined,
    dueDate: formData.get("dueDate") || undefined
  });

  if (!parsed.success) {
    return { error: "Please provide a valid milestone." };
  }

  try {
    await requireTeacherProjectAccess(parsed.data.projectId);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const payload = {
    project_id: parsed.data.projectId,
    title: parsed.data.title,
    description: parsed.data.description?.trim() || "",
    sort_order: parsed.data.sortOrder ?? 0,
    due_date: normalizeDate(parsed.data.dueDate)
  };

  const query = parsed.data.milestoneId
    ? supabase.from("project_milestones").update(payload).eq("id", parsed.data.milestoneId)
    : supabase.from("project_milestones").insert(payload);

  const { error } = await query;
  if (error) {
    return { error: error.message };
  }

  revalidateProjectWorkspace(parsed.data.projectId);
  return { success: parsed.data.milestoneId ? "Milestone updated." : "Milestone added." };
}

export async function saveProjectTaskAction(
  _: ProjectWorkspaceActionState,
  formData: FormData
): Promise<ProjectWorkspaceActionState> {
  const parsed = taskSchema.safeParse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId") || undefined,
    milestoneId: formData.get("milestoneId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    taskType: formData.get("taskType"),
    sortOrder: formData.get("sortOrder") || undefined,
    isRequired: formData.get("isRequired") || undefined,
    dueDate: formData.get("dueDate") || undefined
  });

  if (!parsed.success) {
    return { error: "Please provide a valid project task." };
  }

  try {
    await requireTeacherProjectAccess(parsed.data.projectId);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const payload = {
    project_id: parsed.data.projectId,
    milestone_id: parsed.data.milestoneId || null,
    title: parsed.data.title,
    description: parsed.data.description?.trim() || "",
    task_type: parsed.data.taskType,
    sort_order: parsed.data.sortOrder ?? 0,
    is_required: parsed.data.isRequired !== "false",
    due_date: normalizeDate(parsed.data.dueDate)
  };

  const query = parsed.data.taskId
    ? supabase.from("project_tasks").update(payload).eq("id", parsed.data.taskId)
    : supabase.from("project_tasks").insert(payload);

  const { error } = await query;
  if (error) {
    return { error: error.message };
  }

  revalidateProjectWorkspace(parsed.data.projectId);
  return { success: parsed.data.taskId ? "Task updated." : "Task added." };
}

export async function saveProjectResourceAction(
  _: ProjectWorkspaceActionState,
  formData: FormData
): Promise<ProjectWorkspaceActionState> {
  const parsed = resourceSchema.safeParse({
    projectId: formData.get("projectId"),
    resourceId: formData.get("resourceId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    resourceType: formData.get("resourceType"),
    externalUrl: formData.get("externalUrl") || undefined,
    sortOrder: formData.get("sortOrder") || undefined
  });

  if (!parsed.success) {
    return { error: "Please provide a valid project resource." };
  }

  const { user } = await getProfileForCurrentUser();
  if (!user) {
    return { error: "You must be signed in to manage project resources." };
  }

  try {
    await requireTeacherProjectAccess(parsed.data.projectId);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const payload = {
    project_id: parsed.data.projectId,
    title: parsed.data.title,
    description: parsed.data.description?.trim() || "",
    resource_type: parsed.data.resourceType,
    external_url: parsed.data.resourceType === "link" ? parsed.data.externalUrl || null : null,
    sort_order: parsed.data.sortOrder ?? 0,
    created_by: user.id
  };

  const query = parsed.data.resourceId
    ? supabase.from("project_resources").update(payload).eq("id", parsed.data.resourceId)
    : supabase.from("project_resources").insert(payload);

  const { error } = await query;
  if (error) {
    return { error: error.message };
  }

  revalidateProjectWorkspace(parsed.data.projectId);
  return { success: parsed.data.resourceId ? "Resource updated." : "Resource added." };
}
