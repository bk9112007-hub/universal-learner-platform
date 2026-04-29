import { createClient } from "@/lib/supabase/server";
import { getProjectCatalogItems } from "@/lib/project-catalog/queries";
import type {
  GeneratedProjectRecord,
  ProjectCatalogItemRecord,
  ProjectCatalogType
} from "@/types/domain";

function ensureStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function ensureSnapshot(value: any, fallbackId: string): GeneratedProjectRecord["hookSnapshot"] {
  return {
    id: typeof value?.id === "string" ? value.id : fallbackId,
    title: typeof value?.title === "string" ? value.title : "Unknown",
    summary: typeof value?.summary === "string" ? value.summary : "",
    details: typeof value?.details === "string" ? value.details : "",
    status: value?.status === "draft" || value?.status === "approved" || value?.status === "archived" ? value.status : "draft"
  };
}

function mapGeneratedProjectRow(row: any): GeneratedProjectRecord {
  return {
    id: row.id,
    subject: row.subject,
    skillGoal: row.skill_goal,
    gradeBand: row.grade_band,
    difficulty: row.difficulty,
    duration: row.duration,
    studentInterests: ensureStringArray(row.student_interests),
    title: row.title,
    summary: row.summary,
    studentMission: row.student_mission,
    learningGoals: ensureStringArray(row.learning_goals),
    steps: ensureStringArray(row.steps),
    materials: ensureStringArray(row.materials),
    rubric: ensureStringArray(row.rubric),
    reflectionQuestions: ensureStringArray(row.reflection_questions),
    approvalStatus: row.approval_status,
    hookSnapshot: ensureSnapshot(row.hook_snapshot, row.hook_id ?? "hook"),
    roleSnapshot: ensureSnapshot(row.role_snapshot, row.role_id ?? "role"),
    scenarioSnapshot: ensureSnapshot(row.scenario_snapshot, row.scenario_id ?? "scenario"),
    activitySnapshot: ensureSnapshot(row.activity_snapshot, row.activity_id ?? "activity"),
    outputSnapshot: ensureSnapshot(row.output_snapshot, row.output_id ?? "output"),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getProjectFormulatorOptions(): Promise<Record<ProjectCatalogType, ProjectCatalogItemRecord[]>> {
  const [hooks, roles, scenarios, activities, outputs] = await Promise.all([
    getProjectCatalogItems("hooks"),
    getProjectCatalogItems("roles"),
    getProjectCatalogItems("scenarios"),
    getProjectCatalogItems("activities"),
    getProjectCatalogItems("outputs")
  ]);

  const activeOnly = (items: ProjectCatalogItemRecord[]) => items.filter((item) => item.status !== "archived");

  return {
    hooks: activeOnly(hooks),
    roles: activeOnly(roles),
    scenarios: activeOnly(scenarios),
    activities: activeOnly(activities),
    outputs: activeOnly(outputs)
  };
}

export async function getGeneratedProjects(): Promise<GeneratedProjectRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapGeneratedProjectRow);
}

export async function getGeneratedProjectById(draftProjectId: string): Promise<GeneratedProjectRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_projects")
    .select("*")
    .eq("id", draftProjectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapGeneratedProjectRow(data) : null;
}
