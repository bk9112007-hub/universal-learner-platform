import { createClient } from "@/lib/supabase/server";
import { getProjectCatalogItems } from "@/lib/project-catalog/queries";
import type {
  GeneratedProjectAssignmentRecord,
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

export async function getGeneratedProjectAssignments(draftProjectId: string): Promise<GeneratedProjectAssignmentRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_project_assignments")
    .select("id, generated_project_id, student_id, cohort_id, project_id, status, created_at")
    .eq("generated_project_id", draftProjectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const studentIds = Array.from(new Set((data ?? []).map((row: any) => row.student_id)));
  const cohortIds = Array.from(new Set((data ?? []).map((row: any) => row.cohort_id).filter(Boolean)));
  const [{ data: profiles, error: profilesError }, { data: cohorts, error: cohortsError }, generatedProject] = await Promise.all([
    studentIds.length ? supabase.from("profiles").select("id, full_name").in("id", studentIds) : { data: [], error: null },
    cohortIds.length ? supabase.from("cohorts").select("id, title").in("id", cohortIds) : { data: [], error: null },
    getGeneratedProjectById(draftProjectId)
  ]);

  if (profilesError) throw new Error(profilesError.message);
  if (cohortsError) throw new Error(cohortsError.message);

  const profileMap = new Map<string, string>((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));
  const cohortMap = new Map<string, string>((cohorts ?? []).map((cohort: any) => [cohort.id, cohort.title]));

  return (data ?? []).map((row: any) => ({
    id: row.id,
    generatedProjectId: row.generated_project_id,
    generatedProjectTitle: generatedProject?.title ?? "Generated project",
    studentId: row.student_id,
    studentName: profileMap.get(row.student_id) ?? "Student",
    cohortId: row.cohort_id ?? null,
    cohortTitle: row.cohort_id ? cohortMap.get(row.cohort_id) ?? null : null,
    projectId: row.project_id ?? null,
    status: row.status,
    createdAt: row.created_at
  }));
}

export async function getGeneratedAssignedProjectsForStudent(studentId: string): Promise<GeneratedProjectAssignmentRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_project_assignments")
    .select("id, generated_project_id, student_id, cohort_id, project_id, status, created_at")
    .eq("student_id", studentId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const generatedProjectIds = Array.from(new Set((data ?? []).map((row: any) => row.generated_project_id)));
  const cohortIds = Array.from(new Set((data ?? []).map((row: any) => row.cohort_id).filter(Boolean)));
  const [{ data: generatedProjects, error: generatedProjectsError }, { data: cohorts, error: cohortsError }] = await Promise.all([
    generatedProjectIds.length ? supabase.from("generated_projects").select("id, title").in("id", generatedProjectIds) : { data: [], error: null },
    cohortIds.length ? supabase.from("cohorts").select("id, title").in("id", cohortIds) : { data: [], error: null }
  ]);

  if (generatedProjectsError) throw new Error(generatedProjectsError.message);
  if (cohortsError) throw new Error(cohortsError.message);

  const generatedProjectMap = new Map<string, string>((generatedProjects ?? []).map((row: any) => [row.id, row.title]));
  const cohortMap = new Map<string, string>((cohorts ?? []).map((cohort: any) => [cohort.id, cohort.title]));

  return (data ?? []).map((row: any) => ({
    id: row.id,
    generatedProjectId: row.generated_project_id,
    generatedProjectTitle: generatedProjectMap.get(row.generated_project_id) ?? "Generated project",
    studentId: row.student_id,
    studentName: "You",
    cohortId: row.cohort_id ?? null,
    cohortTitle: row.cohort_id ? cohortMap.get(row.cohort_id) ?? null : null,
    projectId: row.project_id ?? null,
    status: row.status,
    createdAt: row.created_at
  }));
}
