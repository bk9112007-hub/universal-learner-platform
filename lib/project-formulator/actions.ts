"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { composeGeneratedProjectDraft } from "@/lib/project-formulator/engine";
import { getGeneratedProjectById } from "@/lib/project-formulator/queries";
import { getProjectCatalogDefinition } from "@/lib/project-catalog/catalog";
import { createProjectWorkspaceFromGeneratedProject } from "@/lib/projects/workspace";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProjectFormulatorActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
};

const createGeneratedProjectSchema = z.object({
  subject: z.string().min(2).max(120),
  skillGoal: z.string().min(2).max(160),
  gradeBand: z.string().min(2).max(80),
  difficulty: z.string().min(2).max(80),
  duration: z.string().min(2).max(80),
  studentInterests: z.string().max(400).optional(),
  hookId: z.string().uuid(),
  roleId: z.string().uuid(),
  scenarioId: z.string().uuid(),
  activityId: z.string().uuid(),
  outputId: z.string().uuid()
});

const updateGeneratedProjectSchema = z.object({
  draftProjectId: z.string().uuid(),
  subject: z.string().min(2).max(120),
  skillGoal: z.string().min(2).max(160),
  gradeBand: z.string().min(2).max(80),
  difficulty: z.string().min(2).max(80),
  duration: z.string().min(2).max(80),
  studentInterests: z.string().max(400).optional(),
  title: z.string().min(4).max(200),
  summary: z.string().min(20).max(2000),
  studentMission: z.string().min(20).max(2000),
  learningGoals: z.string().min(20),
  steps: z.string().min(20),
  materials: z.string().min(20),
  rubric: z.string().min(20),
  reflectionQuestions: z.string().min(20),
  intent: z.enum(["save_draft", "approve", "assign_later", "archive"])
});

const assignGeneratedProjectToStudentSchema = z.object({
  draftProjectId: z.string().uuid(),
  studentId: z.string().uuid()
});

const assignGeneratedProjectToCohortSchema = z.object({
  draftProjectId: z.string().uuid(),
  cohortId: z.string().uuid()
});

async function requireStaffOrAdmin() {
  const { profile, user } = await getProfileForCurrentUser();
  if (!user || !profile || !["teacher", "admin"].includes(profile.role)) {
    throw new Error("Only staff and admins can use the project formulator.");
  }

  return { user, profile };
}

function parseInterests(value?: string | null) {
  return (value ?? "")
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function fetchCatalogItem(catalogType: "hooks" | "roles" | "scenarios" | "activities" | "outputs", itemId: string) {
  const definition = getProjectCatalogDefinition(catalogType);
  const supabase = createAdminClient();
  const { data, error } = await supabase.from(definition.table).select("id, title, summary, details, status").eq("id", itemId).maybeSingle();

  if (error || !data) {
    throw new Error(`The selected ${definition.singular} could not be found.`);
  }

  return {
    id: data.id,
    type: catalogType,
    title: data.title,
    summary: data.summary,
    details: data.details,
    status: data.status,
    createdAt: "",
    updatedAt: "",
    createdBy: null,
    updatedBy: null
  } as const;
}

export async function createGeneratedProjectDraftAction(
  _: ProjectFormulatorActionState,
  formData: FormData
): Promise<ProjectFormulatorActionState> {
  let actor;
  try {
    actor = await requireStaffOrAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = createGeneratedProjectSchema.safeParse({
    subject: formData.get("subject"),
    skillGoal: formData.get("skillGoal"),
    gradeBand: formData.get("gradeBand"),
    difficulty: formData.get("difficulty"),
    duration: formData.get("duration"),
    studentInterests: formData.get("studentInterests") || undefined,
    hookId: formData.get("hookId"),
    roleId: formData.get("roleId"),
    scenarioId: formData.get("scenarioId"),
    activityId: formData.get("activityId"),
    outputId: formData.get("outputId")
  });

  if (!parsed.success) {
    return { error: "Please choose a complete project configuration before creating a draft." };
  }

  try {
    const [hook, role, scenario, activity, output] = await Promise.all([
      fetchCatalogItem("hooks", parsed.data.hookId),
      fetchCatalogItem("roles", parsed.data.roleId),
      fetchCatalogItem("scenarios", parsed.data.scenarioId),
      fetchCatalogItem("activities", parsed.data.activityId),
      fetchCatalogItem("outputs", parsed.data.outputId)
    ]);

    const draft = composeGeneratedProjectDraft({
      subject: parsed.data.subject,
      skillGoal: parsed.data.skillGoal,
      gradeBand: parsed.data.gradeBand,
      difficulty: parsed.data.difficulty,
      duration: parsed.data.duration,
      studentInterests: parseInterests(parsed.data.studentInterests),
      hook,
      role,
      scenario,
      activity,
      output
    });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("generated_projects")
      .insert({
        subject: draft.subject,
        skill_goal: draft.skillGoal,
        grade_band: draft.gradeBand,
        difficulty: draft.difficulty,
        duration: draft.duration,
        student_interests: draft.studentInterests,
        hook_id: hook.id,
        role_id: role.id,
        scenario_id: scenario.id,
        activity_id: activity.id,
        output_id: output.id,
        hook_snapshot: draft.hookSnapshot,
        role_snapshot: draft.roleSnapshot,
        scenario_snapshot: draft.scenarioSnapshot,
        activity_snapshot: draft.activitySnapshot,
        output_snapshot: draft.outputSnapshot,
        title: draft.title,
        summary: draft.summary,
        student_mission: draft.studentMission,
        learning_goals: draft.learningGoals,
        steps: draft.steps,
        materials: draft.materials,
        rubric: draft.rubric,
        reflection_questions: draft.reflectionQuestions,
        approval_status: "draft",
        created_by: actor.user.id,
        updated_by: actor.user.id
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "The draft could not be created." };
    }

    revalidatePath("/app/admin/project-formulator");
    revalidatePath(`/app/admin/project-formulator/${data.id}`);
    return {
      success: "Draft project created.",
      redirectTo: `/app/admin/project-formulator/${data.id}`
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function updateGeneratedProjectDraftAction(
  _: ProjectFormulatorActionState,
  formData: FormData
): Promise<ProjectFormulatorActionState> {
  let actor;
  try {
    actor = await requireStaffOrAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = updateGeneratedProjectSchema.safeParse({
    draftProjectId: formData.get("draftProjectId"),
    subject: formData.get("subject"),
    skillGoal: formData.get("skillGoal"),
    gradeBand: formData.get("gradeBand"),
    difficulty: formData.get("difficulty"),
    duration: formData.get("duration"),
    studentInterests: formData.get("studentInterests") || undefined,
    title: formData.get("title"),
    summary: formData.get("summary"),
    studentMission: formData.get("studentMission"),
    learningGoals: formData.get("learningGoals"),
    steps: formData.get("steps"),
    materials: formData.get("materials"),
    rubric: formData.get("rubric"),
    reflectionQuestions: formData.get("reflectionQuestions"),
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    return { error: "Please complete the editable draft fields before saving." };
  }

  const approvalStatus =
    parsed.data.intent === "save_draft"
      ? "draft"
      : parsed.data.intent === "approve"
        ? "approved"
        : parsed.data.intent === "assign_later"
          ? "assigned"
          : "archived";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("generated_projects")
    .update({
      subject: parsed.data.subject,
      skill_goal: parsed.data.skillGoal,
      grade_band: parsed.data.gradeBand,
      difficulty: parsed.data.difficulty,
      duration: parsed.data.duration,
      student_interests: parseInterests(parsed.data.studentInterests),
      title: parsed.data.title,
      summary: parsed.data.summary,
      student_mission: parsed.data.studentMission,
      learning_goals: parseLines(parsed.data.learningGoals),
      steps: parseLines(parsed.data.steps),
      materials: parseLines(parsed.data.materials),
      rubric: parseLines(parsed.data.rubric),
      reflection_questions: parseLines(parsed.data.reflectionQuestions),
      approval_status: approvalStatus,
      updated_by: actor.user.id
    })
    .eq("id", parsed.data.draftProjectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/admin/project-formulator");
  revalidatePath(`/app/admin/project-formulator/${parsed.data.draftProjectId}`);
  return {
    success:
      parsed.data.intent === "approve"
        ? "Draft approved."
        : parsed.data.intent === "assign_later"
          ? "Draft marked for later assignment."
          : parsed.data.intent === "archive"
            ? "Draft archived."
            : "Draft saved."
  };
}

export async function assignGeneratedProjectToStudentAction(
  _: ProjectFormulatorActionState,
  formData: FormData
): Promise<ProjectFormulatorActionState> {
  let actor;
  try {
    actor = await requireStaffOrAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = assignGeneratedProjectToStudentSchema.safeParse({
    draftProjectId: formData.get("draftProjectId"),
    studentId: formData.get("studentId")
  });

  if (!parsed.success) {
    return { error: "Please choose a student before assigning this project." };
  }

  const generatedProject = await getGeneratedProjectById(parsed.data.draftProjectId);
  if (!generatedProject) {
    return { error: "That generated project draft could not be found." };
  }
  if (!["approved", "assigned"].includes(generatedProject.approvalStatus)) {
    return { error: "Only approved drafts can be assigned to learners." };
  }

  try {
    const projectId = await createProjectWorkspaceFromGeneratedProject({
      generatedProject,
      studentId: parsed.data.studentId,
      assignedBy: actor.user.id
    });

    const supabase = createAdminClient();
    const { error } = await supabase.from("generated_project_assignments").upsert(
      {
        generated_project_id: parsed.data.draftProjectId,
        student_id: parsed.data.studentId,
        project_id: projectId,
        assigned_by: actor.user.id,
        status: "launched"
      },
      { onConflict: "generated_project_id,student_id" }
    );

    if (error) {
      return { error: error.message };
    }

    await supabase
      .from("generated_projects")
      .update({
        approval_status: "assigned",
        updated_by: actor.user.id
      })
      .eq("id", parsed.data.draftProjectId);

    revalidatePath("/app/projects");
    revalidatePath(`/app/projects/${projectId}`);
    revalidatePath(`/app/admin/project-formulator/${parsed.data.draftProjectId}`);
    revalidatePath("/app/student");
    revalidatePath("/app/teacher");
    return { success: "Generated project assigned and launched for the student workspace." };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function assignGeneratedProjectToCohortAction(
  _: ProjectFormulatorActionState,
  formData: FormData
): Promise<ProjectFormulatorActionState> {
  let actor;
  try {
    actor = await requireStaffOrAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = assignGeneratedProjectToCohortSchema.safeParse({
    draftProjectId: formData.get("draftProjectId"),
    cohortId: formData.get("cohortId")
  });

  if (!parsed.success) {
    return { error: "Please choose a cohort before assigning this project." };
  }

  const generatedProject = await getGeneratedProjectById(parsed.data.draftProjectId);
  if (!generatedProject) {
    return { error: "That generated project draft could not be found." };
  }
  if (!["approved", "assigned"].includes(generatedProject.approvalStatus)) {
    return { error: "Only approved drafts can be assigned to cohorts." };
  }

  const supabase = createAdminClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from("teacher_student_assignments")
    .select("student_id")
    .eq("cohort_id", parsed.data.cohortId);

  if (assignmentsError) {
    return { error: assignmentsError.message };
  }

  const studentIds: string[] = Array.from(
    new Set(
      (assignments ?? [])
        .map((assignment: any) => assignment.student_id)
        .filter((studentId: unknown): studentId is string => typeof studentId === "string")
    )
  );
  if (studentIds.length === 0) {
    return { error: "This cohort does not have any assigned learners yet." };
  }

  try {
    for (const studentId of studentIds) {
      const projectId = await createProjectWorkspaceFromGeneratedProject({
        generatedProject,
        studentId,
        assignedBy: actor.user.id,
        cohortId: parsed.data.cohortId
      });

      const { error } = await supabase.from("generated_project_assignments").upsert(
        {
          generated_project_id: parsed.data.draftProjectId,
          student_id: studentId,
          cohort_id: parsed.data.cohortId,
          project_id: projectId,
          assigned_by: actor.user.id,
          status: "launched"
        },
        { onConflict: "generated_project_id,student_id" }
      );

      if (error) {
        return { error: error.message };
      }
    }

    await supabase
      .from("generated_projects")
      .update({
        approval_status: "assigned",
        updated_by: actor.user.id
      })
      .eq("id", parsed.data.draftProjectId);

    revalidatePath("/app/projects");
    revalidatePath(`/app/admin/project-formulator/${parsed.data.draftProjectId}`);
    revalidatePath("/app/student");
    revalidatePath("/app/teacher");
    return { success: "Generated project assigned to the cohort and launched into student workspaces." };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
