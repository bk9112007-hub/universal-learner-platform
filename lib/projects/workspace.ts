import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  PersonalizedProjectBriefRecord,
  PersonalizedProjectRubricRecord,
  PersonalizedProjectTimelineRecord,
  ProjectWorkspaceMilestoneRecord,
  ProjectWorkspaceRecord,
  ProjectWorkspaceResourceRecord,
  ProjectWorkspaceSubmissionRecord,
  ProjectWorkspaceTaskRecord,
  SubmissionFileRecord,
  UserRole
} from "@/types/domain";

type WorkspaceBriefSeed = {
  id: string;
  title: string;
  description: string;
  teacher_priorities: string;
  focus_strengths: string[] | null;
  focus_weaknesses: string[] | null;
  skills_targeted: string[] | null;
  milestones: unknown;
  rubric: unknown;
  timeline: unknown;
  group_name: string | null;
};

type ProjectAccessContext = {
  allowed: boolean;
  userId: string | null;
  project: any | null;
  profile: { id: string; full_name: string | null; role: UserRole } | null;
  accessRole: UserRole | null;
  accessLabel: string;
  canStudentEdit: boolean;
  canTeacherManage: boolean;
  isReadOnly: boolean;
};

function parseMilestones(value: unknown): Array<{ title: string; description: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const title = "title" in entry && typeof entry.title === "string" ? entry.title.trim() : "";
      const description = "description" in entry && typeof entry.description === "string" ? entry.description.trim() : "";

      if (!title) {
        return null;
      }

      return { title, description };
    })
    .filter(Boolean) as Array<{ title: string; description: string }>;
}

function parseRubric(value: unknown): PersonalizedProjectRubricRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const criterion = "criterion" in entry && typeof entry.criterion === "string" ? entry.criterion.trim() : "";
      const description = "description" in entry && typeof entry.description === "string" ? entry.description.trim() : "";

      if (!criterion) {
        return null;
      }

      return { criterion, description };
    })
    .filter(Boolean) as PersonalizedProjectRubricRecord[];
}

function parseTimeline(value: unknown): PersonalizedProjectTimelineRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const label = "label" in entry && typeof entry.label === "string" ? entry.label.trim() : "";
      const goal = "goal" in entry && typeof entry.goal === "string" ? entry.goal.trim() : "";

      if (!label) {
        return null;
      }

      return { label, goal };
    })
    .filter(Boolean) as PersonalizedProjectTimelineRecord[];
}

function buildPersonalizedReason(brief: WorkspaceBriefSeed): string {
  const strengths = Array.isArray(brief.focus_strengths) ? brief.focus_strengths.filter(Boolean) : [];
  const weaknesses = Array.isArray(brief.focus_weaknesses) ? brief.focus_weaknesses.filter(Boolean) : [];

  const parts = [
    brief.teacher_priorities?.trim() ? `Teacher priority: ${brief.teacher_priorities.trim()}` : null,
    strengths.length > 0 ? `Built to use strengths in ${strengths.join(", ")}.` : null,
    weaknesses.length > 0 ? `Targets growth in ${weaknesses.join(", ")}.` : null,
    brief.group_name ? `Designed inside the ${brief.group_name} group context.` : null
  ].filter(Boolean);

  return parts.join(" ");
}

export function buildProjectWorkspaceSeedFromBrief(brief: WorkspaceBriefSeed) {
  const milestones = parseMilestones(brief.milestones);
  const rubric = parseRubric(brief.rubric);
  const timeline = parseTimeline(brief.timeline);
  const targetSkills = Array.isArray(brief.skills_targeted) ? brief.skills_targeted.filter(Boolean) : [];

  const fallbackMilestones =
    milestones.length > 0
      ? milestones
      : [
          { title: "Project kickoff", description: "Review the brief, define the problem, and outline the approach." },
          { title: "Research and evidence", description: "Collect examples, facts, or evidence that support the project." },
          { title: "Final presentation", description: "Prepare the finished work for teacher review and reflection." }
        ];

  const checklistTasks = fallbackMilestones.map((milestone, index) => ({
    title: milestone.title,
    description: milestone.description || `Complete the milestone work for ${milestone.title}.`,
    milestoneIndex: index,
    taskType: "checklist" as const,
    isRequired: true
  }));

  const submissionTask = {
    title: "Submit final project work",
    description: "Upload the finished project evidence, notes, or deliverables for teacher review.",
    milestoneIndex: fallbackMilestones.length - 1,
    taskType: "submission" as const,
    isRequired: true
  };

  return {
    personalizedReason: buildPersonalizedReason(brief),
    targetSkills,
    rubric,
    timeline,
    milestones: fallbackMilestones,
    tasks: [...checklistTasks, submissionTask]
  };
}

async function createSignedUrlMap(files: Array<{ id: string; bucket: string | null; storage_path: string | null }>) {
  const adminSupabase = createAdminClient();
  const signedUrls = new Map<string, string | null>();

  await Promise.all(
    files
      .filter((file) => file.bucket && file.storage_path)
      .map(async (file) => {
        const { data } = await adminSupabase.storage.from(file.bucket!).createSignedUrl(file.storage_path!, 60 * 30);
        signedUrls.set(file.id, data?.signedUrl ?? null);
      })
  );

  return signedUrls;
}

function formatSubmissionFile(file: any, signedUrlMap: Map<string, string | null>): SubmissionFileRecord {
  return {
    id: file.id,
    fileName: file.file_name,
    mimeType: file.mime_type ?? null,
    storagePath: file.storage_path,
    downloadUrl: signedUrlMap.get(file.id) ?? null
  };
}

export async function getProjectWorkspaceAccessContext(projectId: string): Promise<ProjectAccessContext> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      userId: null,
      project: null,
      profile: null,
      accessRole: null,
      accessLabel: "",
      canStudentEdit: false,
      canTeacherManage: false,
      isReadOnly: true
    };
  }

  const [{ data: profile, error: profileError }, { data: project, error: projectError }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").eq("id", user.id).single(),
    supabase
      .from("projects")
      .select(
        `
        id,
        student_id,
        program_id,
        lesson_id,
        lesson_task_id,
        personalized_brief_id,
        personalized_reason,
        target_skills,
        workspace_rubric,
        workspace_timeline,
        title,
        subject,
        description,
        status,
        created_at,
        personalized_project_briefs (
          id,
          title,
          description,
          teacher_priorities,
          focus_strengths,
          focus_weaknesses,
          skills_targeted,
          milestones,
          rubric,
          timeline,
          group_name
        )
      `
      )
      .eq("id", projectId)
      .single()
  ]);

  if (profileError || !profile || projectError || !project) {
    return {
      allowed: false,
      userId: user.id,
      project: null,
      profile: null,
      accessRole: null,
      accessLabel: "",
      canStudentEdit: false,
      canTeacherManage: false,
      isReadOnly: true
    };
  }

  if (profile.role === "admin") {
    return {
      allowed: true,
      userId: user.id,
      project,
      profile,
      accessRole: "admin",
      accessLabel: "Admin inspection view",
      canStudentEdit: false,
      canTeacherManage: true,
      isReadOnly: false
    };
  }

  if (profile.role === "student" && project.student_id === user.id) {
    return {
      allowed: true,
      userId: user.id,
      project,
      profile,
      accessRole: "student",
      accessLabel: "Your personalized project workspace",
      canStudentEdit: true,
      canTeacherManage: false,
      isReadOnly: false
    };
  }

  if (profile.role === "teacher") {
    const { data: assignment } = await supabase
      .from("teacher_student_assignments")
      .select("student_id")
      .eq("teacher_id", user.id)
      .eq("student_id", project.student_id)
      .maybeSingle();

    if (assignment) {
      return {
        allowed: true,
        userId: user.id,
        project,
        profile,
        accessRole: "teacher",
        accessLabel: "Teacher management view",
        canStudentEdit: false,
        canTeacherManage: true,
        isReadOnly: false
      };
    }
  }

  if (profile.role === "parent") {
    const { data: link } = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_id", user.id)
      .eq("student_id", project.student_id)
      .maybeSingle();

    if (link) {
      return {
        allowed: true,
        userId: user.id,
        project,
        profile,
        accessRole: "parent",
        accessLabel: "Read-only linked learner view",
        canStudentEdit: false,
        canTeacherManage: false,
        isReadOnly: true
      };
    }
  }

  return {
    allowed: false,
    userId: user.id,
    project: null,
    profile,
    accessRole: null,
    accessLabel: "",
    canStudentEdit: false,
    canTeacherManage: false,
    isReadOnly: true
  };
}

export async function ensureProjectWorkspaceSeedFromBrief(projectId: string, briefId: string, studentId: string) {
  const supabase = await createClient();
  const { data: assignment, error: assignmentError } = await supabase
    .from("personalized_project_brief_students")
    .select(
      `
      brief_id,
      personalized_project_briefs (
        id,
        title,
        description,
        teacher_priorities,
        focus_strengths,
        focus_weaknesses,
        skills_targeted,
        milestones,
        rubric,
        timeline,
        group_name
      )
    `
    )
    .eq("brief_id", briefId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const brief = assignment
    ? Array.isArray((assignment as any).personalized_project_briefs)
      ? (assignment as any).personalized_project_briefs[0]
      : (assignment as any).personalized_project_briefs
    : null;

  if (!brief) {
    throw new Error("That personalized project brief is not assigned to this learner.");
  }

  const workspaceSeed = buildProjectWorkspaceSeedFromBrief(brief as WorkspaceBriefSeed);
  const adminSupabase = createAdminClient();

  const [{ count: milestoneCount, error: milestoneCountError }, { count: taskCount, error: taskCountError }] = await Promise.all([
    adminSupabase.from("project_milestones").select("*", { count: "exact", head: true }).eq("project_id", projectId),
    adminSupabase.from("project_tasks").select("*", { count: "exact", head: true }).eq("project_id", projectId)
  ]);

  if (milestoneCountError) {
    throw new Error(milestoneCountError.message);
  }
  if (taskCountError) {
    throw new Error(taskCountError.message);
  }

  const { error: projectUpdateError } = await adminSupabase
    .from("projects")
    .update({
      personalized_reason: workspaceSeed.personalizedReason,
      target_skills: workspaceSeed.targetSkills,
      workspace_rubric: workspaceSeed.rubric,
      workspace_timeline: workspaceSeed.timeline,
      status: "draft"
    })
    .eq("id", projectId);

  if (projectUpdateError) {
    throw new Error(projectUpdateError.message);
  }

  let milestones = await adminSupabase
    .from("project_milestones")
    .select("id, sort_order")
    .eq("project_id", projectId)
    .order("sort_order");

  if ((milestoneCount ?? 0) === 0) {
    milestones = await adminSupabase
      .from("project_milestones")
      .insert(
        workspaceSeed.milestones.map((milestone, index) => ({
          project_id: projectId,
          title: milestone.title,
          description: milestone.description,
          sort_order: index
        }))
      )
      .select("id, sort_order");
  }

  if (milestones.error) {
    throw new Error(milestones.error.message);
  }

  if ((taskCount ?? 0) === 0) {
    const milestoneIdByIndex = new Map<number, string>(
      (milestones.data ?? []).map((milestone: any) => [milestone.sort_order, milestone.id])
    );

    const { error: taskInsertError } = await adminSupabase.from("project_tasks").insert(
      workspaceSeed.tasks.map((task, index) => ({
        project_id: projectId,
        milestone_id: milestoneIdByIndex.get(task.milestoneIndex) ?? null,
        title: task.title,
        description: task.description,
        task_type: task.taskType,
        sort_order: index,
        is_required: task.isRequired
      }))
    );

    if (taskInsertError) {
      throw new Error(taskInsertError.message);
    }
  }
}

export async function getProjectWorkspace(projectId: string): Promise<ProjectWorkspaceRecord | null> {
  const context = await getProjectWorkspaceAccessContext(projectId);
  if (!context.allowed || !context.project || !context.profile || !context.accessRole) {
    return null;
  }

  const supabase = await createClient();
  const studentId = context.project.student_id;
  const [
    { data: studentProfile, error: studentProfileError },
    { data: milestones, error: milestonesError },
    { data: tasks, error: tasksError },
    { data: resources, error: resourcesError },
    { data: taskProgress, error: taskProgressError },
    { data: reflections, error: reflectionsError },
    { data: submissions, error: submissionsError }
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", studentId).single(),
    supabase.from("project_milestones").select("id, title, description, sort_order, due_date").eq("project_id", projectId).order("sort_order"),
    supabase.from("project_tasks").select("id, milestone_id, title, description, task_type, sort_order, is_required, due_date").eq("project_id", projectId).order("sort_order"),
    supabase.from("project_resources").select("id, title, description, resource_type, external_url, sort_order").eq("project_id", projectId).order("sort_order"),
    supabase
      .from("project_task_progress")
      .select("task_id, status, response_text, completed_at, submission_id")
      .eq("project_id", projectId)
      .eq("user_id", studentId),
    supabase.from("project_reflections").select("note, updated_at").eq("project_id", projectId).eq("user_id", studentId).maybeSingle(),
    supabase
      .from("submissions")
      .select(
        `
        id,
        submission_text,
        status,
        submitted_at,
        files (
          id,
          file_name,
          mime_type,
          storage_path,
          bucket
        ),
        feedback (
          id,
          teacher_name,
          score,
          comment,
          created_at
        )
      `
      )
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: false })
  ]);

  if (studentProfileError) throw new Error(studentProfileError.message);
  if (milestonesError) throw new Error(milestonesError.message);
  if (tasksError) throw new Error(tasksError.message);
  if (resourcesError) throw new Error(resourcesError.message);
  if (taskProgressError) throw new Error(taskProgressError.message);
  if (reflectionsError) throw new Error(reflectionsError.message);
  if (submissionsError) throw new Error(submissionsError.message);

  const brief =
    Array.isArray(context.project.personalized_project_briefs) ? context.project.personalized_project_briefs[0] : context.project.personalized_project_briefs;
  const fallbackSeed = brief ? buildProjectWorkspaceSeedFromBrief(brief as WorkspaceBriefSeed) : null;

  const submissionFiles = (submissions ?? []).flatMap((submission: any) => (Array.isArray(submission.files) ? submission.files : []));
  const signedUrlMap = await createSignedUrlMap(submissionFiles);

  const submissionRecords: ProjectWorkspaceSubmissionRecord[] = (submissions ?? []).map((submission: any) => {
    const feedbackEntries = Array.isArray(submission.feedback) ? submission.feedback : [];
    const latestFeedback = [...feedbackEntries].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];

    return {
      id: submission.id,
      submittedAt: submission.submitted_at,
      status: submission.status,
      submissionText: submission.submission_text,
      files: (Array.isArray(submission.files) ? submission.files : []).map((file: any) => formatSubmissionFile(file, signedUrlMap)),
      feedbackComment: latestFeedback?.comment ?? null,
      feedbackScore: latestFeedback?.score ?? null,
      feedbackTeacher: latestFeedback?.teacher_name ?? null
    };
  });

  const submissionMap = new Map<string, ProjectWorkspaceSubmissionRecord>(submissionRecords.map((submission) => [submission.id, submission]));
  const taskProgressMap = new Map<string, any>((taskProgress ?? []).map((entry: any) => [entry.task_id, entry]));

  const taskRecords: ProjectWorkspaceTaskRecord[] =
    (tasks ?? []).length > 0
      ? (tasks ?? []).map((task: any) => {
          const progress = taskProgressMap.get(task.id);
          const latestSubmission = progress?.submission_id ? submissionMap.get(progress.submission_id) ?? null : null;
          const latestSubmissionText = latestSubmission?.submissionText ?? null;

          return {
            id: task.id,
            milestoneId: task.milestone_id ?? null,
            title: task.title,
            description: task.description,
            taskType: task.task_type,
            sortOrder: task.sort_order,
            isRequired: task.is_required,
            dueDate: task.due_date,
            status: progress?.status ?? "not_started",
            responseText: progress?.response_text ?? null,
            completedAt: progress?.completed_at ?? null,
            latestSubmissionId: latestSubmission?.id ?? null,
            latestSubmissionText,
            latestFeedbackComment: latestSubmission?.feedbackComment ?? null,
            latestFeedbackScore: latestSubmission?.feedbackScore ?? null,
            latestFeedbackTeacher: latestSubmission?.feedbackTeacher ?? null,
            files: latestSubmission?.files ?? []
          };
        })
      : (fallbackSeed?.tasks ?? []).map((task, index) => ({
          id: `fallback-${index}`,
          milestoneId: null,
          title: task.title,
          description: task.description,
          taskType: task.taskType,
          sortOrder: index,
          isRequired: task.isRequired,
          dueDate: null,
          status: "not_started",
          responseText: null,
          completedAt: null,
          latestSubmissionId: null,
          latestSubmissionText: null,
          latestFeedbackComment: null,
          latestFeedbackScore: null,
          latestFeedbackTeacher: null,
          files: []
        }));

  const milestoneRecords: ProjectWorkspaceMilestoneRecord[] =
    (milestones ?? []).length > 0
      ? (milestones ?? []).map((milestone: any) => {
          const milestoneTasks = taskRecords.filter((task) => task.milestoneId === milestone.id);
          const completedTaskCount = milestoneTasks.filter((task) => task.status === "completed" || task.status === "submitted").length;

          return {
            id: milestone.id,
            title: milestone.title,
            description: milestone.description,
            sortOrder: milestone.sort_order,
            dueDate: milestone.due_date,
            completedTaskCount,
            taskCount: milestoneTasks.length
          };
        })
      : (fallbackSeed?.milestones ?? []).map((milestone, index) => {
          const milestoneTasks = taskRecords.filter((task, taskIndex) =>
            fallbackSeed?.tasks[taskIndex]?.milestoneIndex === index
          );

          return {
            id: `fallback-milestone-${index}`,
            title: milestone.title,
            description: milestone.description,
            sortOrder: index,
            dueDate: null,
            completedTaskCount: milestoneTasks.filter((task) => task.status === "completed" || task.status === "submitted").length,
            taskCount: milestoneTasks.length
          };
        });

  const taskCount = taskRecords.length;
  const completedTaskCount = taskRecords.filter((task) => task.status === "completed" || task.status === "submitted").length;
  const progressPercent = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : context.project.status === "reviewed" ? 100 : 0;

  return {
    id: context.project.id,
    studentId,
    studentName: studentProfile?.full_name ?? "Student",
    title: context.project.title,
    subject: context.project.subject,
    description: context.project.description,
    status: context.project.status,
    createdAt: context.project.created_at,
    personalizedBriefId: context.project.personalized_brief_id ?? null,
    personalizedBriefTitle: brief?.title ?? null,
    personalizedReason: context.project.personalized_reason ?? fallbackSeed?.personalizedReason ?? null,
    teacherPriorities: brief?.teacher_priorities ?? null,
    targetSkills: Array.isArray(context.project.target_skills) && context.project.target_skills.length > 0
      ? context.project.target_skills
      : fallbackSeed?.targetSkills ?? [],
    rubric: parseRubric(context.project.workspace_rubric).length > 0 ? parseRubric(context.project.workspace_rubric) : fallbackSeed?.rubric ?? [],
    timeline: parseTimeline(context.project.workspace_timeline).length > 0 ? parseTimeline(context.project.workspace_timeline) : fallbackSeed?.timeline ?? [],
    milestones: milestoneRecords,
    tasks: taskRecords,
    resources: (resources ?? []).map((resource: any) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      resourceType: resource.resource_type,
      externalUrl: resource.external_url,
      sortOrder: resource.sort_order
    })) as ProjectWorkspaceResourceRecord[],
    submissions: submissionRecords,
    reflectionNote: reflections?.note ?? null,
    reflectionUpdatedAt: reflections?.updated_at ?? null,
    progressPercent,
    completedTaskCount,
    taskCount,
    accessRole: context.accessRole,
    accessLabel: context.accessLabel,
    canStudentEdit: context.canStudentEdit,
    canTeacherManage: context.canTeacherManage,
    isReadOnly: context.isReadOnly
  };
}
