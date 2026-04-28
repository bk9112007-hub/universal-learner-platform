"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getProfileForCurrentUser, getTeacherAssignedLearners, getTeacherCohorts } from "@/lib/dashboard/queries";
import { buildPersonalizedProjectDraft, getGradeLevelSummary, type PersonalizedProjectGenerationInput } from "@/lib/projects/personalization-engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  InterestAssessmentRecord,
  PersonalizedProjectBriefRecord,
  SkillBand,
  SkillDiagnosticRecord
} from "@/types/domain";

export type PersonalizedProjectActionState = {
  error?: string;
  success?: string;
};

const bandValues = ["well_below", "below", "at", "above", "advanced"] as const;

const interestSchema = z.object({
  careerPreference: z.string().min(2).max(80),
  entertainmentPreference: z.string().min(2).max(80),
  workStyle: z.string().min(2).max(80),
  industryInterest: z.string().min(2).max(80)
});

const skillSchema = z.object({
  reading: z.enum(bandValues),
  writing: z.enum(bandValues),
  math: z.enum(bandValues),
  history: z.enum(bandValues),
  logic: z.enum(bandValues)
});

const generateSchema = z
  .object({
    targetMode: z.enum(["student", "cohort"]),
    studentId: z.string().uuid().optional(),
    cohortId: z.string().uuid().optional(),
    teacherPriorities: z.string().min(10).max(2000),
    focusStrengths: z.string().optional(),
    focusWeaknesses: z.string().optional(),
    groupName: z.string().max(120).optional()
  })
  .superRefine((value, ctx) => {
    if (value.targetMode === "student" && !value.studentId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "studentId is required" });
    }
    if (value.targetMode === "cohort" && !value.cohortId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "cohortId is required" });
    }
  });

const updateBriefSchema = z.object({
  briefId: z.string().uuid(),
  title: z.string().min(3).max(160),
  subject: z.string().min(2).max(80),
  description: z.string().min(20).max(4000),
  milestonesText: z.string().min(10).max(4000),
  skillsTargetedText: z.string().min(3).max(500),
  rubricText: z.string().min(10).max(4000),
  timelineText: z.string().min(10).max(4000)
});

const regenerateBriefSchema = z.object({
  briefId: z.string().uuid()
});

function parseCsv(value: string | undefined | null) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseMilestonesText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...description] = line.split(":");
      return {
        title: title?.trim() || "Milestone",
        description: description.join(":").trim() || title.trim()
      };
    });
}

function parseRubricText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [criterion, ...description] = line.split(":");
      return {
        criterion: criterion?.trim() || "Criterion",
        description: description.join(":").trim() || criterion.trim()
      };
    });
}

function parseTimelineText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...goal] = line.split(":");
      return {
        label: label?.trim() || "Phase",
        goal: goal.join(":").trim() || label.trim()
      };
    });
}

function revalidateProjectSurfaces() {
  revalidatePath("/app/student");
  revalidatePath("/app/teacher");
  revalidatePath("/app/parent");
}

function getStrengthsAndWeaknessesFromBands(levels: Record<string, SkillBand>) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  Object.entries(levels).forEach(([subject, level]) => {
    const label = subject.charAt(0).toUpperCase() + subject.slice(1);
    if (level === "above" || level === "advanced") {
      strengths.push(label);
    }
    if (level === "below" || level === "well_below") {
      weaknesses.push(label);
    }
  });

  return { strengths, weaknesses };
}

async function requireStudent() {
  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile || profile.role !== "student") {
    throw new Error("Only students can manage this personalization profile.");
  }

  return { user, profile };
}

async function requireTeacherOrAdmin() {
  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile || !["teacher", "admin"].includes(profile.role)) {
    throw new Error("Only teachers and admins can generate personalized projects.");
  }

  return { user, profile };
}

export async function getStudentInterestAssessment(studentId: string): Promise<InterestAssessmentRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_interest_assessments")
    .select("career_preference, entertainment_preference, work_style, industry_interest, updated_at")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    careerPreference: data.career_preference,
    entertainmentPreference: data.entertainment_preference,
    workStyle: data.work_style,
    industryInterest: data.industry_interest,
    updatedAt: data.updated_at
  };
}

export async function getStudentSkillDiagnostic(studentId: string): Promise<SkillDiagnosticRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_skill_diagnostics")
    .select("reading_level, writing_level, math_level, history_level, logic_level, strengths, weaknesses, updated_at")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const record: SkillDiagnosticRecord = {
    reading: (data.reading_level as SkillBand | null) ?? null,
    writing: (data.writing_level as SkillBand | null) ?? null,
    math: (data.math_level as SkillBand | null) ?? null,
    history: (data.history_level as SkillBand | null) ?? null,
    logic: (data.logic_level as SkillBand | null) ?? null,
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
    gradeLevelSummary: getGradeLevelSummary({
      reading: (data.reading_level as SkillBand | null) ?? null,
      writing: (data.writing_level as SkillBand | null) ?? null,
      math: (data.math_level as SkillBand | null) ?? null,
      history: (data.history_level as SkillBand | null) ?? null,
      logic: (data.logic_level as SkillBand | null) ?? null,
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : []
    }),
    updatedAt: data.updated_at
  };

  return record;
}

export async function getStudentPersonalizedProjectBriefs(studentId: string): Promise<PersonalizedProjectBriefRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personalized_project_brief_students")
    .select(
      `
      brief_id,
      personalized_project_briefs (
        id,
        teacher_id,
        cohort_id,
        group_name,
        project_mode,
        subject,
        title,
        description,
        teacher_priorities,
        focus_strengths,
        focus_weaknesses,
        skills_targeted,
        milestones,
        rubric,
        timeline,
        status,
        created_at,
        updated_at
      )
    `
    )
    .eq("student_id", studentId);

  if (error) {
    throw new Error(error.message);
  }

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, personalized_brief_id")
    .eq("student_id", studentId)
    .not("personalized_brief_id", "is", null);

  if (projectError) {
    throw new Error(projectError.message);
  }

  const submittedBriefIds = new Set((projects ?? []).map((project: any) => project.personalized_brief_id).filter(Boolean));
  const workspaceProjectIdMap = new Map<string, string>((projects ?? []).filter((project: any) => project.personalized_brief_id).map((project: any) => [project.personalized_brief_id, project.id]));

  return (data ?? []).flatMap((row: any) => {
    const brief = Array.isArray(row.personalized_project_briefs) ? row.personalized_project_briefs[0] : row.personalized_project_briefs;
    if (!brief) {
      return [];
    }

    return [
      {
        id: brief.id,
        title: brief.title,
        subject: brief.subject,
        description: brief.description,
        teacherPriorities: brief.teacher_priorities,
        focusStrengths: Array.isArray(brief.focus_strengths) ? brief.focus_strengths : [],
        focusWeaknesses: Array.isArray(brief.focus_weaknesses) ? brief.focus_weaknesses : [],
        skillsTargeted: Array.isArray(brief.skills_targeted) ? brief.skills_targeted : [],
        milestones: Array.isArray(brief.milestones) ? brief.milestones : [],
        rubric: Array.isArray(brief.rubric) ? brief.rubric : [],
        timeline: Array.isArray(brief.timeline) ? brief.timeline : [],
        projectMode: brief.project_mode,
        targetLabel: submittedBriefIds.has(brief.id) ? "Submitted from this personalized brief" : brief.group_name ? `Assigned group project: ${brief.group_name}` : "Assigned personalized project",
        studentIds: [studentId],
        groupName: brief.group_name ?? null,
        status: brief.status === "edited" ? "edited" : "generated",
        workspaceProjectId: workspaceProjectIdMap.get(brief.id) ?? null,
        workspaceProjectCount: workspaceProjectIdMap.has(brief.id) ? 1 : 0,
        createdAt: brief.created_at,
        updatedAt: brief.updated_at
      } as PersonalizedProjectBriefRecord
    ];
  });
}

export async function getTeacherPersonalizedProjectBriefs(teacherId: string, role: "teacher" | "admin"): Promise<PersonalizedProjectBriefRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("personalized_project_briefs")
    .select("id, teacher_id, cohort_id, group_name, project_mode, subject, title, description, teacher_priorities, focus_strengths, focus_weaknesses, skills_targeted, milestones, rubric, timeline, status, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (role === "teacher") {
    query = query.eq("teacher_id", teacherId);
  }

  const { data: briefs, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const briefIds = (briefs ?? []).map((brief: any) => brief.id);
  const cohortIds = (briefs ?? []).map((brief: any) => brief.cohort_id).filter(Boolean);
  const [
    { data: recipients, error: recipientsError },
    { data: studentProfiles, error: profilesError },
    { data: cohorts, error: cohortsError },
    { data: workspaceProjects, error: workspaceProjectsError }
  ] = await Promise.all([
    briefIds.length ? supabase.from("personalized_project_brief_students").select("brief_id, student_id").in("brief_id", briefIds) : { data: [], error: null },
    briefIds.length
      ? supabase
          .from("personalized_project_brief_students")
          .select("brief_id, student_id, profiles ( full_name )")
          .in("brief_id", briefIds)
      : { data: [], error: null },
    cohortIds.length ? supabase.from("cohorts").select("id, title").in("id", cohortIds) : { data: [], error: null },
    briefIds.length ? supabase.from("projects").select("id, personalized_brief_id").in("personalized_brief_id", briefIds) : { data: [], error: null }
  ]);

  if (recipientsError) throw new Error(recipientsError.message);
  if (profilesError) throw new Error(profilesError.message);
  if (cohortsError) throw new Error(cohortsError.message);
  if (workspaceProjectsError) throw new Error(workspaceProjectsError.message);

  const cohortMap = new Map<string, string>((cohorts ?? []).map((cohort: any) => [cohort.id, cohort.title]));
  const workspaceProjectsByBrief = new Map<string, string[]>();
  for (const project of workspaceProjects ?? []) {
    if (!project.personalized_brief_id) continue;
    const current = workspaceProjectsByBrief.get(project.personalized_brief_id) ?? [];
    current.push(project.id);
    workspaceProjectsByBrief.set(project.personalized_brief_id, current);
  }

  return (briefs ?? []).map((brief: any) => {
    const briefRecipients = (recipients ?? []).filter((recipient: any) => recipient.brief_id === brief.id).map((recipient: any) => recipient.student_id);
    const briefStudentNames = (studentProfiles ?? [])
      .filter((recipient: any) => recipient.brief_id === brief.id)
      .map((recipient: any) => (Array.isArray(recipient.profiles) ? recipient.profiles[0]?.full_name : recipient.profiles?.full_name) ?? "Student");

    return {
      id: brief.id,
      title: brief.title,
      subject: brief.subject,
      description: brief.description,
      teacherPriorities: brief.teacher_priorities,
      focusStrengths: Array.isArray(brief.focus_strengths) ? brief.focus_strengths : [],
      focusWeaknesses: Array.isArray(brief.focus_weaknesses) ? brief.focus_weaknesses : [],
      skillsTargeted: Array.isArray(brief.skills_targeted) ? brief.skills_targeted : [],
      milestones: Array.isArray(brief.milestones) ? brief.milestones : [],
      rubric: Array.isArray(brief.rubric) ? brief.rubric : [],
      timeline: Array.isArray(brief.timeline) ? brief.timeline : [],
      projectMode: brief.project_mode,
      targetLabel:
        brief.project_mode === "group"
          ? `${brief.group_name ?? cohortMap.get(brief.cohort_id) ?? "Group project"} | ${briefRecipients.length} learner${briefRecipients.length === 1 ? "" : "s"}`
          : briefStudentNames[0] ?? "Personalized project",
      studentIds: briefRecipients,
      groupName: brief.group_name ?? null,
      status: brief.status === "edited" ? "edited" : "generated",
      workspaceProjectId: (workspaceProjectsByBrief.get(brief.id) ?? [])[0] ?? null,
      workspaceProjectCount: (workspaceProjectsByBrief.get(brief.id) ?? []).length,
      createdAt: brief.created_at,
      updatedAt: brief.updated_at
    };
  });
}

export async function saveInterestAssessmentAction(_: PersonalizedProjectActionState, formData: FormData): Promise<PersonalizedProjectActionState> {
  let actor;
  try {
    actor = await requireStudent();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = interestSchema.safeParse({
    careerPreference: formData.get("careerPreference"),
    entertainmentPreference: formData.get("entertainmentPreference"),
    workStyle: formData.get("workStyle"),
    industryInterest: formData.get("industryInterest")
  });

  if (!parsed.success) {
    return { error: "Please complete all interest assessment fields." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("student_interest_assessments").upsert(
    {
      student_id: actor.user.id,
      career_preference: parsed.data.careerPreference,
      entertainment_preference: parsed.data.entertainmentPreference,
      work_style: parsed.data.workStyle,
      industry_interest: parsed.data.industryInterest
    },
    { onConflict: "student_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidateProjectSurfaces();
  return { success: "Interest assessment saved." };
}

export async function saveSkillDiagnosticAction(_: PersonalizedProjectActionState, formData: FormData): Promise<PersonalizedProjectActionState> {
  let actor;
  try {
    actor = await requireStudent();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = skillSchema.safeParse({
    reading: formData.get("reading"),
    writing: formData.get("writing"),
    math: formData.get("math"),
    history: formData.get("history"),
    logic: formData.get("logic")
  });

  if (!parsed.success) {
    return { error: "Please complete all skill diagnostic fields." };
  }

  const strengthsAndWeaknesses = getStrengthsAndWeaknessesFromBands(parsed.data);
  const supabase = await createClient();
  const { error } = await supabase.from("student_skill_diagnostics").upsert(
    {
      student_id: actor.user.id,
      reading_level: parsed.data.reading,
      writing_level: parsed.data.writing,
      math_level: parsed.data.math,
      history_level: parsed.data.history,
      logic_level: parsed.data.logic,
      strengths: strengthsAndWeaknesses.strengths,
      weaknesses: strengthsAndWeaknesses.weaknesses
    },
    { onConflict: "student_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidateProjectSurfaces();
  return { success: "Skill diagnostic saved." };
}

async function resolveTargetStudents(params: {
  actorId: string;
  role: "teacher" | "admin";
  targetMode: "student" | "cohort";
  studentId?: string;
  cohortId?: string;
}): Promise<string[]> {
  const adminSupabase = createAdminClient();

  if (params.targetMode === "student" && params.studentId) {
    if (params.role === "teacher") {
      const { data: assignment, error: assignmentError } = await adminSupabase
        .from("teacher_student_assignments")
        .select("student_id")
        .eq("teacher_id", params.actorId)
        .eq("student_id", params.studentId)
        .maybeSingle();

      if (assignmentError) throw new Error(assignmentError.message);
      if (!assignment) throw new Error("That learner is not assigned to this teacher.");
    }

    return [params.studentId];
  }

  if (!params.cohortId) {
    throw new Error("A cohort is required for group project generation.");
  }

  let assignmentQuery = adminSupabase.from("teacher_student_assignments").select("student_id").eq("cohort_id", params.cohortId);
  if (params.role === "teacher") {
    assignmentQuery = assignmentQuery.eq("teacher_id", params.actorId);
  }

  const { data: assignments, error: assignmentError } = await assignmentQuery;
  if (assignmentError) throw new Error(assignmentError.message);

  const studentIds: string[] = Array.from(
    new Set<string>((assignments ?? []).map((assignment: any) => assignment.student_id).filter((value: unknown): value is string => typeof value === "string"))
  );
  if (studentIds.length === 0) {
    throw new Error("This cohort does not have any assigned student accounts yet.");
  }

  return studentIds;
}

async function buildGenerationInput(studentIds: string[], form: z.infer<typeof generateSchema>): Promise<PersonalizedProjectGenerationInput> {
  const adminSupabase = createAdminClient();
  const [{ data: profiles, error: profilesError }, { data: interests, error: interestsError }, { data: diagnostics, error: diagnosticsError }] = await Promise.all([
    adminSupabase.from("profiles").select("id, full_name").in("id", studentIds),
    adminSupabase
      .from("student_interest_assessments")
      .select("student_id, career_preference, entertainment_preference, work_style, industry_interest")
      .in("student_id", studentIds),
    adminSupabase
      .from("student_skill_diagnostics")
      .select("student_id, reading_level, writing_level, math_level, history_level, logic_level, strengths, weaknesses")
      .in("student_id", studentIds)
  ]);

  if (profilesError) throw new Error(profilesError.message);
  if (interestsError) throw new Error(interestsError.message);
  if (diagnosticsError) throw new Error(diagnosticsError.message);

  return {
    learners: studentIds.map((studentId) => {
      const profile = (profiles ?? []).find((entry: any) => entry.id === studentId);
      const interest = (interests ?? []).find((entry: any) => entry.student_id === studentId);
      const diagnostic = (diagnostics ?? []).find((entry: any) => entry.student_id === studentId);

      return {
        fullName: profile?.full_name ?? "Student",
        interests: interest
          ? {
              careerPreference: interest.career_preference,
              entertainmentPreference: interest.entertainment_preference,
              workStyle: interest.work_style,
              industryInterest: interest.industry_interest
            }
          : null,
        diagnostics: diagnostic
          ? {
              reading: (diagnostic.reading_level as SkillBand | null) ?? null,
              writing: (diagnostic.writing_level as SkillBand | null) ?? null,
              math: (diagnostic.math_level as SkillBand | null) ?? null,
              history: (diagnostic.history_level as SkillBand | null) ?? null,
              logic: (diagnostic.logic_level as SkillBand | null) ?? null,
              strengths: Array.isArray(diagnostic.strengths) ? diagnostic.strengths : [],
              weaknesses: Array.isArray(diagnostic.weaknesses) ? diagnostic.weaknesses : []
            }
          : null
      };
    }),
    teacherPriorities: form.teacherPriorities,
    focusStrengths: parseCsv(form.focusStrengths),
    focusWeaknesses: parseCsv(form.focusWeaknesses),
    projectMode: form.targetMode === "student" ? "individual" : "group",
    groupName: form.targetMode === "cohort" ? form.groupName?.trim() || null : null
  };
}

export async function generatePersonalizedProjectAction(
  _: PersonalizedProjectActionState,
  formData: FormData
): Promise<PersonalizedProjectActionState> {
  let actor;
  try {
    actor = await requireTeacherOrAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = generateSchema.safeParse({
    targetMode: formData.get("targetMode"),
    studentId: formData.get("studentId") || undefined,
    cohortId: formData.get("cohortId") || undefined,
    teacherPriorities: formData.get("teacherPriorities"),
    focusStrengths: formData.get("focusStrengths") || undefined,
    focusWeaknesses: formData.get("focusWeaknesses") || undefined,
    groupName: formData.get("groupName") || undefined
  });

  if (!parsed.success) {
    return { error: "Please choose a learner or cohort and provide clear teacher priorities." };
  }

  try {
    const studentIds = await resolveTargetStudents({
      actorId: actor.user.id,
      role: actor.profile.role as "teacher" | "admin",
      targetMode: parsed.data.targetMode,
      studentId: parsed.data.studentId,
      cohortId: parsed.data.cohortId
    });
    const generationInput = await buildGenerationInput(studentIds, parsed.data);
    const draft = buildPersonalizedProjectDraft(generationInput);
    const adminSupabase = createAdminClient();

    const { data: brief, error: briefError } = await adminSupabase
      .from("personalized_project_briefs")
      .insert({
        teacher_id: actor.user.id,
        cohort_id: parsed.data.targetMode === "cohort" ? parsed.data.cohortId ?? null : null,
        group_name: generationInput.projectMode === "group" ? generationInput.groupName : null,
        project_mode: generationInput.projectMode,
        subject: draft.subject,
        title: draft.title,
        description: draft.description,
        teacher_priorities: generationInput.teacherPriorities,
        focus_strengths: generationInput.focusStrengths,
        focus_weaknesses: generationInput.focusWeaknesses,
        skills_targeted: draft.skillsTargeted,
        milestones: draft.milestones,
        rubric: draft.rubric,
        timeline: draft.timeline,
        status: "generated"
      })
      .select("id")
      .single();

    if (briefError || !brief) {
      return { error: briefError?.message ?? "Unable to generate the personalized project brief." };
    }

    const recipients = studentIds.map((studentId) => ({
      brief_id: brief.id,
      student_id: studentId
    }));

    const { error: recipientsError } = await adminSupabase.from("personalized_project_brief_students").insert(recipients);
    if (recipientsError) {
      return { error: recipientsError.message };
    }

    revalidateProjectSurfaces();
    return {
      success: generationInput.projectMode === "group" ? "Group project brief generated." : "Personalized project brief generated."
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function updatePersonalizedProjectBriefAction(
  _: PersonalizedProjectActionState,
  formData: FormData
): Promise<PersonalizedProjectActionState> {
  let actor;
  try {
    actor = await requireTeacherOrAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = updateBriefSchema.safeParse({
    briefId: formData.get("briefId"),
    title: formData.get("title"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    milestonesText: formData.get("milestonesText"),
    skillsTargetedText: formData.get("skillsTargetedText"),
    rubricText: formData.get("rubricText"),
    timelineText: formData.get("timelineText")
  });

  if (!parsed.success) {
    return { error: "Please provide valid project brief content before saving." };
  }

  const adminSupabase = createAdminClient();
  if (actor.profile.role === "teacher") {
    const { data: brief, error: briefError } = await adminSupabase
      .from("personalized_project_briefs")
      .select("teacher_id")
      .eq("id", parsed.data.briefId)
      .maybeSingle();

    if (briefError) {
      return { error: briefError.message };
    }
    if (!brief || brief.teacher_id !== actor.user.id) {
      return { error: "You can only edit personalized projects that you created." };
    }
  }

  const { error } = await adminSupabase
    .from("personalized_project_briefs")
    .update({
      title: parsed.data.title,
      subject: parsed.data.subject,
      description: parsed.data.description,
      milestones: parseMilestonesText(parsed.data.milestonesText),
      skills_targeted: parseCsv(parsed.data.skillsTargetedText),
      rubric: parseRubricText(parsed.data.rubricText),
      timeline: parseTimelineText(parsed.data.timelineText),
      status: "edited"
    })
    .eq("id", parsed.data.briefId);

  if (error) {
    return { error: error.message };
  }

  revalidateProjectSurfaces();
  return { success: "Personalized project brief updated." };
}

export async function regeneratePersonalizedProjectBriefAction(
  _: PersonalizedProjectActionState,
  formData: FormData
): Promise<PersonalizedProjectActionState> {
  let actor;
  try {
    actor = await requireTeacherOrAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = regenerateBriefSchema.safeParse({
    briefId: formData.get("briefId")
  });

  if (!parsed.success) {
    return { error: "A valid personalized project brief is required." };
  }

  const adminSupabase = createAdminClient();
  const { data: brief, error: briefError } = await adminSupabase
    .from("personalized_project_briefs")
    .select("id, teacher_id, cohort_id, group_name, project_mode, teacher_priorities, focus_strengths, focus_weaknesses")
    .eq("id", parsed.data.briefId)
    .maybeSingle();

  if (briefError) {
    return { error: briefError.message };
  }
  if (!brief) {
    return { error: "That personalized project brief could not be found." };
  }
  if (actor.profile.role === "teacher" && brief.teacher_id !== actor.user.id) {
    return { error: "You can only regenerate personalized projects that you created." };
  }

  const { data: recipients, error: recipientsError } = await adminSupabase
    .from("personalized_project_brief_students")
    .select("student_id")
    .eq("brief_id", parsed.data.briefId);

  if (recipientsError) {
    return { error: recipientsError.message };
  }

  const studentIds = (recipients ?? []).map((recipient: any) => recipient.student_id);
  if (studentIds.length === 0) {
    return { error: "This personalized project brief no longer has any assigned learners." };
  }

  try {
    const generationInput = await buildGenerationInput(studentIds, {
      targetMode: brief.project_mode === "group" ? "cohort" : "student",
      studentId: brief.project_mode === "individual" ? studentIds[0] : undefined,
      cohortId: brief.cohort_id ?? undefined,
      teacherPriorities: brief.teacher_priorities ?? "",
      focusStrengths: Array.isArray(brief.focus_strengths)
        ? brief.focus_strengths.filter((value: unknown): value is string => typeof value === "string").join(", ")
        : "",
      focusWeaknesses: Array.isArray(brief.focus_weaknesses)
        ? brief.focus_weaknesses.filter((value: unknown): value is string => typeof value === "string").join(", ")
        : "",
      groupName: brief.group_name ?? undefined
    });
    const draft = buildPersonalizedProjectDraft(generationInput);

    const { error: updateError } = await adminSupabase
      .from("personalized_project_briefs")
      .update({
        subject: draft.subject,
        title: draft.title,
        description: draft.description,
        skills_targeted: draft.skillsTargeted,
        milestones: draft.milestones,
        rubric: draft.rubric,
        timeline: draft.timeline,
        status: "generated"
      })
      .eq("id", parsed.data.briefId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidateProjectSurfaces();
    return { success: "Personalized project brief regenerated." };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function getPersonalizedProjectFormDirectory() {
  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile || !["teacher", "admin"].includes(profile.role)) {
    return {
      students: [],
      cohorts: []
    };
  }

  const [students, cohorts] = await Promise.all([
    getTeacherAssignedLearners(),
    getTeacherCohorts()
  ]);

  return {
    students: students.map((student) => ({ id: student.id, fullName: student.fullName })),
    cohorts: cohorts.map((cohort) => ({ id: cohort.id, title: cohort.title }))
  };
}
