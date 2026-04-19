import { cache } from "react";

import { getDeadlineState } from "@/lib/deadlines/state";
import { getSubmissionBucket } from "@/lib/storage/files";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminNotificationHistoryRecord,
  AdminProgramContentRecord,
  AssessmentRecord,
  CohortRecord,
  EnrolledProgramSummaryRecord,
  EnrollmentRecord,
  NotificationRecord,
  NotificationPreferenceRecord,
  NotificationRunRecord,
  NotificationSettingRecord,
  ParentChildRecord,
  PendingProgramAccessRecord,
  ProgramAccessRecord,
  PurchaseRecord,
  StudentTaskDeadlineRecord,
  StudentProjectRecord,
  SubmissionFileRecord,
  TeacherStudentOptionRecord,
  TeacherSubmissionRecord,
  TeacherProgramProgressRecord,
  TeacherTriageRecord,
  UserRole
} from "@/types/domain";

function formatFileRecord(file: any, downloadUrl: string | null): SubmissionFileRecord {
  return {
    id: file.id,
    fileName: file.file_name,
    mimeType: file.mime_type ?? null,
    storagePath: file.storage_path,
    downloadUrl
  };
}

export const getProfileForCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_path, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    user,
    profile: profile as { id: string; full_name: string | null; role: UserRole }
  };
});

async function createDownloadUrlMap(storagePaths: string[]) {
  if (storagePaths.length === 0) {
    return new Map<string, string | null>();
  }

  const supabase = await createClient();
  const bucket = getSubmissionBucket();

  const signedUrlResults = await Promise.all(
    storagePaths.map(async (path) => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
      return [path, error ? null : data.signedUrl] as const;
    })
  );

  return new Map<string, string | null>(signedUrlResults);
}

async function getTeacherScope() {
  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile) {
    return { user: null, profile: null, assignedStudentIds: [] as string[], cohortMap: new Map<string, string | null>() };
  }
  if (profile.role === "admin") {
    return { user, profile, assignedStudentIds: [] as string[], cohortMap: new Map<string, string | null>() };
  }

  const supabase = await createClient();
  const { data: assignments, error } = await supabase
    .from("teacher_student_assignments")
    .select("student_id, cohort_id, cohorts ( title )")
    .eq("teacher_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  const cohortMap = new Map<string, string | null>(
    (assignments ?? []).map((assignment: any) => [
      assignment.student_id,
      Array.isArray(assignment.cohorts) ? assignment.cohorts[0]?.title ?? null : assignment.cohorts?.title ?? null
    ])
  );

  return {
    user,
    profile,
    assignedStudentIds: (assignments ?? []).map((assignment: any) => assignment.student_id),
    cohortMap
  };
}

export async function getStudentProjects(studentId: string): Promise<StudentProjectRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      subject,
      description,
      status,
      created_at,
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
          storage_path
        )
      )
    `
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const storagePaths = (data ?? [])
    .flatMap((project: any) => (Array.isArray(project.submissions) ? project.submissions : []))
    .flatMap((submission: any) => (Array.isArray(submission.files) ? submission.files : []))
    .map((file: any) => file.storage_path);

  const downloadUrlMap = await createDownloadUrlMap(storagePaths);

  return (data ?? []).map((project: any) => {
    const submissions = Array.isArray(project.submissions) ? project.submissions : [];
    const latestSubmission = [...submissions].sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at))[0];
    const latestFeedback =
      latestSubmission?.feedback && Array.isArray(latestSubmission.feedback)
        ? [...latestSubmission.feedback].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]
        : null;
    const latestFiles = Array.isArray(latestSubmission?.files)
      ? latestSubmission.files.map((file: any) => formatFileRecord(file, downloadUrlMap.get(file.storage_path) ?? null))
      : [];

    return {
      id: project.id,
      title: project.title,
      subject: project.subject,
      description: project.description,
      status: project.status,
      createdAt: project.created_at,
      latestSubmissionId: latestSubmission?.id ?? null,
      latestSubmissionText: latestSubmission?.submission_text ?? null,
      latestFeedbackComment: latestFeedback?.comment ?? null,
      latestFeedbackScore: latestFeedback?.score ?? null,
      latestFeedbackTeacher: latestFeedback?.teacher_name ?? null,
      files: latestFiles
    };
  });
}

export async function getTeacherSubmissionFeed(filters?: {
  learnerId?: string;
  programId?: string;
  reviewStatus?: string;
}): Promise<TeacherSubmissionRecord[]> {
  const scope = await getTeacherScope();
  const supabase = await createClient();
  let query = supabase
    .from("submissions")
    .select(
      `
      id,
      project_id,
      student_id,
      submission_text,
      status,
      submitted_at,
      projects (
        id,
        program_id,
        lesson_id,
        lesson_task_id,
        title,
        subject,
        description,
        status
      ),
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
        storage_path
      )
    `
    )
    .order("submitted_at", { ascending: false });

  if (scope.profile?.role === "teacher") {
    if (scope.assignedStudentIds.length === 0) {
      return [];
    }
    query = query.in("student_id", scope.assignedStudentIds);
  }
  if (filters?.learnerId) {
    query = query.eq("student_id", filters.learnerId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const studentIds = Array.from(new Set((data ?? []).map((submission: any) => submission.student_id)));
  const lessonIds = Array.from(
    new Set(
      (data ?? [])
        .map((submission: any) => (Array.isArray(submission.projects) ? submission.projects[0]?.lesson_id : submission.projects?.lesson_id))
        .filter(Boolean)
    )
  );
  const taskIds = Array.from(
    new Set(
      (data ?? [])
        .map((submission: any) => (Array.isArray(submission.projects) ? submission.projects[0]?.lesson_task_id : submission.projects?.lesson_task_id))
        .filter(Boolean)
    )
  );
  const { data: profiles, error: profilesError } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [], error: null };
  const { data: lessonRows, error: lessonRowsError } = lessonIds.length
    ? await supabase.from("program_lessons").select("id, title").in("id", lessonIds)
    : { data: [], error: null };
  const { data: taskRows, error: taskRowsError } = taskIds.length
    ? await supabase.from("lesson_tasks").select("id, title").in("id", taskIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }
  if (lessonRowsError) {
    throw new Error(lessonRowsError.message);
  }
  if (taskRowsError) {
    throw new Error(taskRowsError.message);
  }

  const storagePaths = (data ?? [])
    .flatMap((submission: any) => (Array.isArray(submission.files) ? submission.files : []))
    .map((file: any) => file.storage_path);

  const downloadUrlMap = await createDownloadUrlMap(storagePaths);
  const studentNameMap = new Map<string, string>((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));
  const lessonTitleMap = new Map<string, string>((lessonRows ?? []).map((lesson: any) => [lesson.id, lesson.title]));
  const taskTitleMap = new Map<string, string>((taskRows ?? []).map((task: any) => [task.id, task.title]));

  return (data ?? []).map((submission: any) => {
    const feedbackEntries = Array.isArray(submission.feedback) ? submission.feedback : [];
    const latestFeedback = [...feedbackEntries].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
    const project = Array.isArray(submission.projects) ? submission.projects[0] : submission.projects;
    const files = Array.isArray(submission.files)
      ? submission.files.map((file: any) => formatFileRecord(file, downloadUrlMap.get(file.storage_path) ?? null))
      : [];

    if (filters?.programId && project?.program_id !== filters.programId) {
      return null;
    }
    if (filters?.reviewStatus && (project?.status ?? submission.status) !== filters.reviewStatus) {
      return null;
    }

    return {
      submissionId: submission.id,
      projectId: submission.project_id,
      studentId: submission.student_id,
      studentName: studentNameMap.get(submission.student_id) ?? "Student",
      title: project?.title ?? "Untitled Project",
      subject: project?.subject ?? "General",
      description: project?.description ?? "",
      contextLabel:
        project?.lesson_task_id && project?.lesson_id
          ? `${lessonTitleMap.get(project.lesson_id) ?? "Lesson"} | ${taskTitleMap.get(project.lesson_task_id) ?? "Task"}`
          : null,
      submissionText: submission.submission_text,
      projectStatus: project?.status ?? submission.status,
      submittedAt: submission.submitted_at,
      feedbackComment: latestFeedback?.comment ?? null,
      feedbackScore: latestFeedback?.score ?? null,
      feedbackTeacher: latestFeedback?.teacher_name ?? null,
      files
    } as TeacherSubmissionRecord;
  }).filter(Boolean) as TeacherSubmissionRecord[];
}

export async function getStudentAssessments(studentId: string): Promise<AssessmentRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, student_id, teacher_id, title, subject, description, status, due_date, score, teacher_comment, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((assessment: any) => ({
    id: assessment.id,
    title: assessment.title,
    subject: assessment.subject,
    description: assessment.description,
    status: assessment.status,
    dueDate: assessment.due_date,
    assignedAt: assessment.created_at,
    score: assessment.score,
    teacherComment: assessment.teacher_comment,
    studentId: assessment.student_id,
    studentName: null,
    teacherId: assessment.teacher_id
  }));
}

export async function getTeacherAssessments(): Promise<AssessmentRecord[]> {
  const scope = await getTeacherScope();
  const supabase = await createClient();
  let query = supabase
    .from("assessments")
    .select("id, student_id, teacher_id, title, subject, description, status, due_date, score, teacher_comment, created_at")
    .order("created_at", { ascending: false });

  if (scope.profile?.role === "teacher") {
    if (scope.assignedStudentIds.length === 0) {
      return [];
    }
    query = query.in("student_id", scope.assignedStudentIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const studentIds = Array.from(new Set((data ?? []).map((assessment: any) => assessment.student_id)));
  const { data: profiles, error: profilesError } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const studentNameMap = new Map<string, string>((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));

  return (data ?? []).map((assessment: any) => ({
    id: assessment.id,
    title: assessment.title,
    subject: assessment.subject,
    description: assessment.description,
    status: assessment.status,
    dueDate: assessment.due_date,
    assignedAt: assessment.created_at,
    score: assessment.score,
    teacherComment: assessment.teacher_comment,
    studentId: assessment.student_id,
    studentName: studentNameMap.get(assessment.student_id) ?? "Student",
    teacherId: assessment.teacher_id
  }));
}

export async function getStudentAssessmentCount(studentId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase.from("assessments").select("*", { count: "exact", head: true }).eq("student_id", studentId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getTeacherSummary() {
  const scope = await getTeacherScope();
  const supabase = await createClient();
  const submissionQuery = supabase.from("submissions").select("*", { count: "exact", head: true });
  const feedbackQuery = supabase.from("feedback").select("*", { count: "exact", head: true });
  const assessmentQuery = supabase.from("assessments").select("*", { count: "exact", head: true });

  if (scope.profile?.role === "teacher") {
    if (scope.assignedStudentIds.length === 0) {
      return {
        submissionCount: 0,
        feedbackCount: 0,
        assessmentCount: 0
      };
    }
    submissionQuery.in("student_id", scope.assignedStudentIds);
    feedbackQuery.in("student_id", scope.assignedStudentIds);
    assessmentQuery.in("student_id", scope.assignedStudentIds);
  }

  const [
    { count: submissionCount, error: submissionsError },
    { count: feedbackCount, error: feedbackError },
    { count: assessmentCount, error: assessmentError }
  ] = await Promise.all([submissionQuery, feedbackQuery, assessmentQuery]);

  if (submissionsError) {
    throw new Error(submissionsError.message);
  }
  if (feedbackError) {
    throw new Error(feedbackError.message);
  }
  if (assessmentError) {
    throw new Error(assessmentError.message);
  }

  return {
    submissionCount: submissionCount ?? 0,
    feedbackCount: feedbackCount ?? 0,
    assessmentCount: assessmentCount ?? 0
  };
}

export async function getTeacherProgramProgressFeed(filters?: {
  learnerId?: string;
  programId?: string;
  dueState?: string;
  cohortId?: string;
}): Promise<TeacherProgramProgressRecord[]> {
  const scope = await getTeacherScope();
  const supabase = await createClient();
  let scopedStudentIds = scope.assignedStudentIds;
  if (scope.profile?.role === "teacher" && filters?.cohortId && scope.user) {
    const { data: cohortAssignments, error: cohortAssignmentsError } = await supabase
      .from("teacher_student_assignments")
      .select("student_id")
      .eq("teacher_id", scope.user.id)
      .eq("cohort_id", filters.cohortId);
    if (cohortAssignmentsError) {
      throw new Error(cohortAssignmentsError.message);
    }
    scopedStudentIds = (cohortAssignments ?? []).map((assignment: any) => assignment.student_id);
  }
  let enrollmentsQuery = supabase
    .from("enrollments")
    .select("id, user_id, program_id, programs ( title, slug )")
    .eq("status", "active");

  if (scope.profile?.role === "teacher") {
    if (scopedStudentIds.length === 0) {
      return [];
    }
    enrollmentsQuery = enrollmentsQuery.in("user_id", scopedStudentIds);
  }
  if (filters?.learnerId) {
    enrollmentsQuery = enrollmentsQuery.eq("user_id", filters.learnerId);
  }
  if (filters?.programId) {
    enrollmentsQuery = enrollmentsQuery.eq("program_id", filters.programId);
  }

  const [
    { data: enrollments, error: enrollmentError },
    { data: lessons, error: lessonsError },
    { data: progressRows, error: progressError },
    { data: reflectionRows, error: reflectionError },
    { data: taskRows, error: taskError },
    { data: taskProgressRows, error: taskProgressError },
    { data: profiles, error: profilesError }
  ] = await Promise.all([
    enrollmentsQuery,
    supabase.from("program_lessons").select("id, program_id, title, is_published").eq("is_published", true),
    supabase.from("user_lesson_progress").select("user_id, program_id, lesson_id, status"),
    supabase.from("lesson_reflections").select("user_id, program_id, lesson_id, note, updated_at"),
    supabase.from("lesson_tasks").select("id, lesson_id, is_required, task_type"),
    supabase.from("lesson_task_progress").select("user_id, program_id, lesson_id, task_id, status"),
    supabase.from("profiles").select("id, full_name, role").eq("role", "student")
  ]);

  if (enrollmentError) throw new Error(enrollmentError.message);
  if (lessonsError) throw new Error(lessonsError.message);
  if (progressError) throw new Error(progressError.message);
  if (reflectionError) throw new Error(reflectionError.message);
  if (taskError) throw new Error(taskError.message);
  if (taskProgressError) throw new Error(taskProgressError.message);
  if (profilesError) throw new Error(profilesError.message);

  const profileMap = new Map<string, string>((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));

  return (enrollments ?? []).map((enrollment: any) => {
    const program = Array.isArray(enrollment.programs) ? enrollment.programs[0] : enrollment.programs;
    const programLessons = (lessons ?? []).filter((lesson: any) => lesson.program_id === enrollment.program_id);
    const userProgress = (progressRows ?? []).filter(
      (row: any) => row.user_id === enrollment.user_id && row.program_id === enrollment.program_id
    );
    const completedLessons = userProgress.filter((row: any) => row.status === "completed").length;
    const latestReflection = [...(reflectionRows ?? []).filter((row: any) => row.user_id === enrollment.user_id && row.program_id === enrollment.program_id)].sort(
      (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)
    )[0];

    const lessonIds = programLessons.map((lesson: any) => lesson.id);
    const programTasks = (taskRows ?? []).filter((task: any) => lessonIds.includes(task.lesson_id));
    const userTaskProgress = (taskProgressRows ?? []).filter(
      (row: any) => row.user_id === enrollment.user_id && row.program_id === enrollment.program_id
    );

    return {
      enrollmentId: enrollment.id,
      programId: enrollment.program_id,
      programTitle: program?.title ?? "Program",
      programSlug: program?.slug ?? "",
      studentId: enrollment.user_id,
      studentName: profileMap.get(enrollment.user_id) ?? "Student",
      cohortTitle: scope.cohortMap.get(enrollment.user_id) ?? null,
      progressPercent: programLessons.length > 0 ? Math.round((completedLessons / programLessons.length) * 100) : 0,
      completedLessons,
      totalLessons: programLessons.length,
      latestReflectionLessonTitle: latestReflection
        ? (programLessons.find((lesson: any) => lesson.id === latestReflection.lesson_id)?.title ?? "Lesson")
        : null,
      latestReflectionNote: latestReflection?.note ?? null,
      pendingSubmissionTasks: programTasks.filter((task: any) => {
        if (task.task_type !== "submission") return false;
        const taskProgress = userTaskProgress.find((row: any) => row.task_id === task.id);
        return taskProgress?.status === "submitted";
      }).length,
      needsRevisionTasks: userTaskProgress.filter((row: any) => row.status === "needs_revision").length
    } as TeacherProgramProgressRecord;
  }).filter((record: TeacherProgramProgressRecord) => {
    if (!record) return false;
    if (filters?.dueState === "attention") {
      return record.pendingSubmissionTasks + record.needsRevisionTasks > 0;
    }
    return true;
  });
}

export async function getStudentOptionsForTeacher() {
  const scope = await getTeacherScope();
  const supabase = await createClient();
  let query = supabase.from("profiles").select("id, full_name, role").eq("role", "student").order("full_name");
  if (scope.profile?.role === "teacher" && scope.assignedStudentIds.length > 0) {
    query = query.in("id", scope.assignedStudentIds);
  }
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((profile: any) => ({
    id: profile.id,
    fullName: profile.full_name ?? "Student"
  }));
}

export async function getAllStudentOptions(): Promise<TeacherStudentOptionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name, role").eq("role", "student").order("full_name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((profile: any) => ({
    id: profile.id,
    fullName: profile.full_name ?? "Student",
    cohortId: null,
    cohortTitle: null
  }));
}

export async function getTeacherCohorts(): Promise<CohortRecord[]> {
  const scope = await getTeacherScope();
  const supabase = await createClient();

  let cohortQuery = supabase
    .from("cohorts")
    .select("id, title, description, teacher_id, program_id, programs ( title )")
    .order("created_at", { ascending: false });

  if (scope.profile?.role === "teacher" && scope.user) {
    cohortQuery = cohortQuery.eq("teacher_id", scope.user.id);
  }

  const { data: cohorts, error: cohortError } = await cohortQuery;
  if (cohortError) {
    throw new Error(cohortError.message);
  }

  const cohortIds = (cohorts ?? []).map((cohort: any) => cohort.id);
  const { data: assignments, error: assignmentError } = cohortIds.length
    ? await supabase.from("teacher_student_assignments").select("cohort_id").in("cohort_id", cohortIds)
    : { data: [], error: null };

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  return (cohorts ?? []).map((cohort: any) => ({
    id: cohort.id,
    title: cohort.title,
    description: cohort.description,
    programTitle: Array.isArray(cohort.programs) ? cohort.programs[0]?.title ?? null : cohort.programs?.title ?? null,
    learnerCount: (assignments ?? []).filter((assignment: any) => assignment.cohort_id === cohort.id).length
  }));
}

export async function getTeacherAssignedLearners(): Promise<TeacherStudentOptionRecord[]> {
  const scope = await getTeacherScope();
  if (scope.profile?.role === "teacher" && scope.assignedStudentIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  let query = supabase.from("teacher_student_assignments").select("student_id, cohort_id").order("created_at", { ascending: false });

  if (scope.profile?.role === "teacher" && scope.user) {
    query = query.eq("teacher_id", scope.user.id);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const studentIds = (data ?? []).map((assignment: any) => assignment.student_id);
  const cohortIds = (data ?? []).map((assignment: any) => assignment.cohort_id).filter(Boolean);
  const [{ data: profiles, error: profilesError }, { data: cohorts, error: cohortsError }] = await Promise.all([
    studentIds.length ? supabase.from("profiles").select("id, full_name").in("id", studentIds) : { data: [], error: null },
    cohortIds.length ? supabase.from("cohorts").select("id, title").in("id", cohortIds) : { data: [], error: null }
  ]);

  if (profilesError) throw new Error(profilesError.message);
  if (cohortsError) throw new Error(cohortsError.message);

  const profileMap = new Map<string, string>((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));
  const cohortMap = new Map<string, string>((cohorts ?? []).map((cohort: any) => [cohort.id, cohort.title]));

  return (data ?? []).map((assignment: any) => ({
    id: assignment.student_id,
    fullName: profileMap.get(assignment.student_id) ?? "Student",
    cohortId: assignment.cohort_id ?? null,
    cohortTitle: assignment.cohort_id ? cohortMap.get(assignment.cohort_id) ?? null : null
  }));
}

export async function getStudentTaskDeadlines(studentId: string): Promise<StudentTaskDeadlineRecord[]> {
  const supabase = await createClient();
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("program_id, programs ( title, slug )")
    .eq("user_id", studentId)
    .eq("status", "active");

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const programs = (enrollments ?? []).map((row: any) => ({
    id: row.program_id,
    title: Array.isArray(row.programs) ? row.programs[0]?.title ?? "Program" : row.programs?.title ?? "Program",
    slug: Array.isArray(row.programs) ? row.programs[0]?.slug ?? "" : row.programs?.slug ?? ""
  }));
  const programIds = programs.map((program: { id: string }) => program.id);
  if (programIds.length === 0) {
    return [];
  }

  const [
    { data: lessons, error: lessonsError },
    { data: tasks, error: tasksError },
    { data: progressRows, error: taskProgressError },
    { data: projects, error: projectsError }
  ] = await Promise.all([
    supabase.from("program_lessons").select("id, program_id, title").in("program_id", programIds),
    supabase.from("lesson_tasks").select("id, lesson_id, title, task_type, due_date").not("due_date", "is", null),
    supabase.from("lesson_task_progress").select("task_id, status, project_id").eq("user_id", studentId).in("program_id", programIds),
    supabase
      .from("projects")
      .select(
        `
        id,
        lesson_task_id,
        submissions (
          id,
          feedback (
            comment,
            created_at
          )
        )
      `
      )
      .eq("student_id", studentId)
      .in("program_id", programIds)
  ]);

  if (lessonsError) throw new Error(lessonsError.message);
  if (tasksError) throw new Error(tasksError.message);
  if (taskProgressError) throw new Error(taskProgressError.message);
  if (projectsError) throw new Error(projectsError.message);

  const lessonMap = new Map<string, any>((lessons ?? []).map((lesson: any) => [lesson.id, lesson]));
  const progressMap = new Map<string, any>((progressRows ?? []).map((row: any) => [row.task_id, row]));
  const projectMap = new Map<string, any>((projects ?? []).map((project: any) => [project.lesson_task_id, project]));
  const programMap = new Map<string, { title: string; slug: string }>(
    programs.map((program: { id: string; title: string; slug: string }) => [program.id, { title: program.title, slug: program.slug }])
  );

  return (tasks ?? [])
    .map((task: any) => {
      const lesson = lessonMap.get(task.lesson_id);
      if (!lesson) return null;
      const program = programMap.get(lesson.program_id);
      const status = progressMap.get(task.id)?.status ?? "not_started";
      const project = projectMap.get(task.id);
      const latestSubmission = Array.isArray(project?.submissions) ? project.submissions[0] : null;
      const latestFeedback = Array.isArray(latestSubmission?.feedback) ? latestSubmission.feedback[0] : null;

      return {
        taskId: task.id,
        programTitle: program?.title ?? "Program",
        programSlug: program?.slug ?? "",
        lessonTitle: lesson.title,
        taskTitle: task.title,
        taskType: task.task_type,
        dueDate: task.due_date,
        dueState: getDeadlineState(task.due_date, status),
        status,
        latestFeedbackComment: latestFeedback?.comment ?? null
      } as StudentTaskDeadlineRecord;
    })
    .filter(Boolean)
    .sort((a: StudentTaskDeadlineRecord, b: StudentTaskDeadlineRecord) => String(a.dueDate).localeCompare(String(b.dueDate))) as StudentTaskDeadlineRecord[];
}

export async function getParentChildTaskDeadlines(parentId: string): Promise<Array<{ studentId: string; studentName: string; tasks: StudentTaskDeadlineRecord[] }>> {
  const children = await getParentLinkedChildren(parentId);
  const results = await Promise.all(
    children.map(async (child) => ({
      studentId: child.studentId,
      studentName: child.studentName,
      tasks: await getStudentTaskDeadlines(child.studentId)
    }))
  );
  return results;
}

export async function getTeacherTriageRecords(filters?: {
  learnerId?: string;
  programId?: string;
  taskType?: string;
  dueState?: string;
  reviewStatus?: string;
  cohort?: string;
}): Promise<TeacherTriageRecord[]> {
  const scope = await getTeacherScope();
  if (scope.profile?.role === "teacher" && scope.assignedStudentIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  let assignmentQuery = supabase.from("teacher_student_assignments").select("student_id, cohort_id");
  if (scope.profile?.role === "teacher" && scope.user) {
    assignmentQuery = assignmentQuery.eq("teacher_id", scope.user.id);
  }
  if (filters?.learnerId) {
    assignmentQuery = assignmentQuery.eq("student_id", filters.learnerId);
  }
  if (filters?.cohort) {
    assignmentQuery = assignmentQuery.eq("cohort_id", filters.cohort);
  }

  const { data: assignments, error: assignmentError } = await assignmentQuery;
  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const studentIds = (assignments ?? []).map((assignment: any) => assignment.student_id);
  if (studentIds.length === 0) {
    return [];
  }

  const [
    { data: studentProfiles, error: studentProfilesError },
    { data: cohortRows, error: cohortRowsError },
    { data: enrollments, error: enrollmentsError },
    { data: lessons, error: lessonsError },
    { data: tasks, error: tasksError },
    { data: taskProgressRows, error: taskProgressError }
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", studentIds),
    supabase.from("cohorts").select("id, title").in("id", (assignments ?? []).map((assignment: any) => assignment.cohort_id).filter(Boolean)),
    supabase
      .from("enrollments")
      .select("user_id, program_id, programs ( title )")
      .eq("status", "active")
      .in("user_id", studentIds),
    supabase.from("program_lessons").select("id, program_id, title"),
    supabase.from("lesson_tasks").select("id, lesson_id, title, task_type, due_date"),
    supabase.from("lesson_task_progress").select("user_id, task_id, status, lesson_id, program_id").in("user_id", studentIds)
  ]);

  if (studentProfilesError) throw new Error(studentProfilesError.message);
  if (cohortRowsError) throw new Error(cohortRowsError.message);
  if (enrollmentsError) throw new Error(enrollmentsError.message);
  if (lessonsError) throw new Error(lessonsError.message);
  if (tasksError) throw new Error(tasksError.message);
  if (taskProgressError) throw new Error(taskProgressError.message);

  const assignmentMap = new Map<string, any>((assignments ?? []).map((assignment: any) => [assignment.student_id, assignment]));
  const studentProfileMap = new Map<string, string>((studentProfiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));
  const cohortTitleMap = new Map<string, string>((cohortRows ?? []).map((cohort: any) => [cohort.id, cohort.title]));
  const lessonMap = new Map<string, any>((lessons ?? []).map((lesson: any) => [lesson.id, lesson]));

  const records: TeacherTriageRecord[] = [];
  for (const enrollment of enrollments ?? []) {
    const assignment = assignmentMap.get(enrollment.user_id);
    const studentName = studentProfileMap.get(enrollment.user_id) ?? "Student";
    const cohortTitle = assignment?.cohort_id ? cohortTitleMap.get(assignment.cohort_id) ?? null : null;
    const programTitle = Array.isArray(enrollment.programs) ? enrollment.programs[0]?.title ?? "Program" : enrollment.programs?.title ?? "Program";
    const programTasks = (tasks ?? []).filter((task: any) => {
      const lesson = lessonMap.get(task.lesson_id);
      return lesson?.program_id === enrollment.program_id;
    });

    for (const task of programTasks) {
      const progress = (taskProgressRows ?? []).find((row: any) => row.user_id === enrollment.user_id && row.task_id === task.id);
      const status = progress?.status ?? "not_started";
      const dueState = getDeadlineState(task.due_date, status);
      const lesson = lessonMap.get(task.lesson_id);
      const record: TeacherTriageRecord = {
        taskId: task.id,
        studentId: enrollment.user_id,
        studentName,
        cohortTitle,
        programTitle,
        lessonTitle: lesson?.title ?? "Lesson",
        taskTitle: task.title,
        taskType: task.task_type,
        dueDate: task.due_date,
        dueState,
        status
      };

      if (filters?.programId && enrollment.program_id !== filters.programId) continue;
      if (filters?.taskType && record.taskType !== filters.taskType) continue;
      if (filters?.dueState && record.dueState !== filters.dueState) continue;
      if (filters?.reviewStatus && record.status !== filters.reviewStatus) continue;

      records.push(record);
    }
  }

  return records.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
}

export async function getParentSummary(userId: string) {
  const supabase = await createClient();
  const [{ count: purchaseCount, error: purchaseError }, { count: enrollmentCount, error: enrollmentError }] = await Promise.all([
    supabase.from("purchases").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  if (purchaseError) {
    throw new Error(purchaseError.message);
  }
  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  return {
    purchaseCount: purchaseCount ?? 0,
    enrollmentCount: enrollmentCount ?? 0
  };
}

export async function getParentLinkedChildren(parentId: string): Promise<ParentChildRecord[]> {
  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", parentId);

  if (linksError) {
    throw new Error(linksError.message);
  }

  const studentIds = (links ?? []).map((link: any) => link.student_id);
  if (studentIds.length === 0) {
    return [];
  }

  const [
    { data: profiles, error: profilesError },
    { data: projects, error: projectsError },
    { data: submissions, error: submissionsError },
    { data: feedback, error: feedbackError },
    { data: assessments, error: assessmentsError }
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", studentIds),
    supabase.from("projects").select("id, student_id, title, created_at").in("student_id", studentIds),
    supabase.from("submissions").select("id, student_id").in("student_id", studentIds),
    supabase.from("feedback").select("id, student_id, comment, created_at").in("student_id", studentIds),
    supabase
      .from("assessments")
      .select("id, student_id, title, score, status, created_at")
      .in("student_id", studentIds)
  ]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }
  if (projectsError) {
    throw new Error(projectsError.message);
  }
  if (submissionsError) {
    throw new Error(submissionsError.message);
  }
  if (feedbackError) {
    throw new Error(feedbackError.message);
  }
  if (assessmentsError) {
    throw new Error(assessmentsError.message);
  }

  return studentIds.map((studentId: string) => {
    const childProfile = (profiles ?? []).find((profile: any) => profile.id === studentId);
    const childProjects = (projects ?? []).filter((project: any) => project.student_id === studentId);
    const childSubmissions = (submissions ?? []).filter((submission: any) => submission.student_id === studentId);
    const childFeedback = (feedback ?? []).filter((entry: any) => entry.student_id === studentId);
    const childAssessments = (assessments ?? []).filter((entry: any) => entry.student_id === studentId);
    const gradedAssessments = childAssessments.filter((entry: any) => entry.status === "graded" && entry.score !== null);
    const latestProject = [...childProjects].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
    const latestFeedback = [...childFeedback].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
    const latestAssessment = [...childAssessments].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
    const averageAssessmentScore = gradedAssessments.length
      ? gradedAssessments.reduce((total: number, entry: any) => total + Number(entry.score), 0) / gradedAssessments.length
      : null;

    return {
      studentId,
      studentName: childProfile?.full_name ?? "Student",
      projectCount: childProjects.length,
      submissionCount: childSubmissions.length,
      feedbackCount: childFeedback.length,
      gradedAssessmentCount: gradedAssessments.length,
      averageAssessmentScore,
      latestProjectTitle: latestProject?.title ?? null,
      latestFeedbackComment: latestFeedback?.comment ?? null,
      latestAssessmentTitle: latestAssessment?.title ?? null
    };
  });
}

export async function getAdminSummary() {
  const supabase = await createClient();
  const [
    { count: userCount, error: userError },
    { count: projectCount, error: projectError },
    { count: purchaseCount, error: purchaseError }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("purchases").select("*", { count: "exact", head: true })
  ]);

  if (userError) {
    throw new Error(userError.message);
  }
  if (projectError) {
    throw new Error(projectError.message);
  }
  if (purchaseError) {
    throw new Error(purchaseError.message);
  }

  return {
    userCount: userCount ?? 0,
    projectCount: projectCount ?? 0,
    purchaseCount: purchaseCount ?? 0
  };
}

export async function getProgramAccessRecords(userId: string, role: UserRole): Promise<ProgramAccessRecord[]> {
  const supabase = await createClient();
  const { data: programs, error: programsError } = await supabase
    .from("programs")
    .select("id, title, slug, description, price_cents, shopify_product_id, is_active")
    .eq("is_active", true)
    .order("created_at");

  if (programsError) {
    throw new Error(programsError.message);
  }

  const { data: ownEnrollments, error: ownEnrollmentError } = await supabase
    .from("enrollments")
    .select("id, user_id, program_id, status")
    .eq("status", "active")
    .eq("user_id", userId);

  if (ownEnrollmentError) {
    throw new Error(ownEnrollmentError.message);
  }

  let linkedChildEnrollmentMap = new Map<string, string>();
  if (role === "parent") {
    const { data: links, error: linkError } = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_id", userId);

    if (linkError) {
      throw new Error(linkError.message);
    }

    const studentIds = (links ?? []).map((link: any) => link.student_id);
    if (studentIds.length > 0) {
      const { data: childEnrollments, error: childEnrollmentError } = await supabase
        .from("enrollments")
        .select("program_id, user_id")
        .eq("status", "active")
        .in("user_id", studentIds);

      if (childEnrollmentError) {
        throw new Error(childEnrollmentError.message);
      }

      const { data: childProfiles, error: childProfilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      if (childProfilesError) {
        throw new Error(childProfilesError.message);
      }

      const nameMap = new Map<string, string>((childProfiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));
      linkedChildEnrollmentMap = new Map<string, string>(
        (childEnrollments ?? []).map((enrollment: any) => [enrollment.program_id, nameMap.get(enrollment.user_id) ?? "Student"])
      );
    }
  }

  const ownEnrollmentSet = new Set((ownEnrollments ?? []).map((enrollment: any) => enrollment.program_id));

  return (programs ?? []).map((program: any) => {
    const hasOwnEnrollment = ownEnrollmentSet.has(program.id);
    const linkedChildName = linkedChildEnrollmentMap.get(program.id) ?? null;

    return {
      id: program.id,
      title: program.title,
      slug: program.slug,
      description: program.description,
      priceCents: program.price_cents,
      shopifyProductId: program.shopify_product_id,
      isActive: program.is_active,
      isEnrolled: hasOwnEnrollment || Boolean(linkedChildName),
      accessSource: hasOwnEnrollment ? "direct" : linkedChildName ? "linked-child" : "none",
      enrollmentUserName: linkedChildName
    };
  });
}

export async function getStudentEnrolledPrograms(studentId: string): Promise<EnrolledProgramSummaryRecord[]> {
  const supabase = await createClient();
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("program_id, programs ( id, title, slug, description )")
    .eq("user_id", studentId)
    .eq("status", "active");

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const programRows = (enrollments ?? [])
    .map((row: any) => (Array.isArray(row.programs) ? row.programs[0] : row.programs))
    .filter(Boolean);

  if (programRows.length === 0) {
    return [];
  }

  const programIds = programRows.map((program: any) => program.id);
  const [{ data: lessons, error: lessonsError }, { data: progress, error: progressError }] = await Promise.all([
    supabase
      .from("program_lessons")
      .select("id, program_id, title, sort_order, is_published")
      .in("program_id", programIds)
      .eq("is_published", true)
      .order("sort_order"),
    supabase.from("user_lesson_progress").select("lesson_id, program_id, status").eq("user_id", studentId).in("program_id", programIds)
  ]);

  if (lessonsError) {
    throw new Error(lessonsError.message);
  }
  if (progressError) {
    throw new Error(progressError.message);
  }

  const progressMap = new Map<string, string>((progress ?? []).map((entry: any) => [entry.lesson_id, entry.status]));

  return programRows.map((program: any) => {
    const programLessons = (lessons ?? []).filter((lesson: any) => lesson.program_id === program.id);
    const completedLessonCount = programLessons.filter((lesson: any) => progressMap.get(lesson.id) === "completed").length;
    const nextLesson = programLessons.find((lesson: any) => progressMap.get(lesson.id) !== "completed");
    const lessonCount = programLessons.length;

    return {
      id: program.id,
      title: program.title,
      slug: program.slug,
      description: program.description,
      progressPercent: lessonCount > 0 ? Math.round((completedLessonCount / lessonCount) * 100) : 0,
      lessonCount,
      completedLessonCount,
      nextLessonTitle: nextLesson?.title ?? null,
      accessLabel: "Unlocked for this account"
    };
  });
}

export async function getParentAccessibleProgramSummaries(parentId: string): Promise<EnrolledProgramSummaryRecord[]> {
  const supabase = await createClient();
  const records = await getProgramAccessRecords(parentId, "parent");
  const accessiblePrograms = records.filter((record) => record.isEnrolled);

  if (accessiblePrograms.length === 0) {
    return [];
  }

  const { data: links, error: linkError } = await supabase.from("parent_student_links").select("student_id").eq("parent_id", parentId);
  if (linkError) {
    throw new Error(linkError.message);
  }

  const childIds = (links ?? []).map((link: any) => link.student_id);
  const linkedChildPrograms = accessiblePrograms.filter((program) => program.accessSource === "linked-child");
  const directPrograms = accessiblePrograms.filter((program) => program.accessSource === "direct");

  const directSummaries = directPrograms.map((program) => ({
    id: program.id,
    title: program.title,
    slug: program.slug,
    description: program.description,
    progressPercent: 0,
    lessonCount: 0,
    completedLessonCount: 0,
    nextLessonTitle: null,
    accessLabel: "Unlocked for this parent account"
  }));

  if (linkedChildPrograms.length === 0 || childIds.length === 0) {
    return directSummaries;
  }

  const programIds = linkedChildPrograms.map((program) => program.id);
  const [{ data: activeEnrollments, error: enrollmentError }, { data: lessons, error: lessonsError }, { data: progressRows, error: progressError }] =
    await Promise.all([
      supabase.from("enrollments").select("user_id, program_id").eq("status", "active").in("user_id", childIds).in("program_id", programIds),
      supabase
        .from("program_lessons")
        .select("id, program_id, title, sort_order, is_published")
        .in("program_id", programIds)
        .eq("is_published", true)
        .order("sort_order"),
      supabase.from("user_lesson_progress").select("user_id, lesson_id, program_id, status").in("user_id", childIds).in("program_id", programIds)
    ]);

  if (enrollmentError) throw new Error(enrollmentError.message);
  if (lessonsError) throw new Error(lessonsError.message);
  if (progressError) throw new Error(progressError.message);

  const enrollmentUserMap = new Map<string, string>((activeEnrollments ?? []).map((row: any) => [row.program_id, row.user_id]));

  const linkedSummaries = linkedChildPrograms.map((program) => {
    const childId = enrollmentUserMap.get(program.id) ?? null;
    const programLessons = (lessons ?? []).filter((lesson: any) => lesson.program_id === program.id);
    const childProgressRows = (progressRows ?? []).filter((row: any) => row.program_id === program.id && row.user_id === childId);
    const completedLessonIds = new Set(
      childProgressRows.filter((row: any) => row.status === "completed").map((row: any) => row.lesson_id)
    );
    const nextLesson = programLessons.find((lesson: any) => !completedLessonIds.has(lesson.id));
    const lessonCount = programLessons.length;
    const completedLessonCount = completedLessonIds.size;

    return {
      id: program.id,
      title: program.title,
      slug: program.slug,
      description: program.description,
      progressPercent: lessonCount > 0 ? Math.round((completedLessonCount / lessonCount) * 100) : 0,
      lessonCount,
      completedLessonCount,
      nextLessonTitle: nextLesson?.title ?? null,
      accessLabel: `Visible through linked child enrollment for ${program.enrollmentUserName ?? "student"}`
    };
  });

  return [...directSummaries, ...linkedSummaries];
}

export async function getUserPurchases(userId: string): Promise<PurchaseRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("id, shopify_order_id, email, amount_cents, currency, status, processing_state, processing_error, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((purchase: any) => ({
    id: purchase.id,
    orderId: purchase.shopify_order_id,
    email: purchase.email,
    amountCents: purchase.amount_cents,
    currency: purchase.currency,
    financialStatus: purchase.status,
    processingState: purchase.processing_state,
    processingError: purchase.processing_error,
    createdAt: purchase.created_at
  }));
}

export async function getAdminCommerceOverview(): Promise<{
  programs: Array<{
    id: string;
    title: string;
    slug: string;
    description: string;
    priceCents: number;
    shopifyProductId: string | null;
    isActive: boolean;
    updatedAt: string;
  }>;
  enrollments: EnrollmentRecord[];
  purchases: PurchaseRecord[];
  pendingAccess: PendingProgramAccessRecord[];
  users: Array<{ id: string; fullName: string; email: string | null; role: UserRole }>;
}> {
  const supabase = await createClient();
  const [
    { data: programs, error: programError },
    { data: enrollments, error: enrollmentError },
    { data: purchases, error: purchaseError },
    { data: pendingAccess, error: pendingError },
    { data: profiles, error: profileError }
  ] = await Promise.all([
    supabase
      .from("programs")
      .select("id, title, slug, description, price_cents, shopify_product_id, is_active, updated_at")
      .order("created_at"),
    supabase
      .from("enrollments")
      .select("id, user_id, program_id, status, source_purchase_id, access_reason, granted_by_admin_id, revoked_at, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("purchases")
      .select("id, shopify_order_id, email, amount_cents, currency, status, processing_state, processing_error, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("pending_program_access")
      .select("id, email, program_id, status, purchase_id, created_at, resolved_by_admin_id, resolution_note")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, role")
  ]);

  if (programError) throw new Error(programError.message);
  if (enrollmentError) throw new Error(enrollmentError.message);
  if (purchaseError) throw new Error(purchaseError.message);
  if (pendingError) throw new Error(pendingError.message);
  if (profileError) throw new Error(profileError.message);

  const profileMap = new Map<string, string>((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "User"]));
  const programMap = new Map<string, { title: string; slug: string }>((programs ?? []).map((program: any) => [program.id, { title: program.title, slug: program.slug }]));

  return {
    programs: (programs ?? []).map((program: any) => ({
      id: program.id,
      title: program.title,
      slug: program.slug,
      description: program.description,
      priceCents: program.price_cents,
      shopifyProductId: program.shopify_product_id,
      isActive: program.is_active,
      updatedAt: program.updated_at
    })),
    enrollments: (enrollments ?? []).map((enrollment: any) => ({
      id: enrollment.id,
      programTitle: programMap.get(enrollment.program_id)?.title ?? "Program",
      programSlug: programMap.get(enrollment.program_id)?.slug ?? "program",
      userId: enrollment.user_id,
      userName: profileMap.get(enrollment.user_id) ?? "User",
      status: enrollment.status,
      purchaseId: enrollment.source_purchase_id,
      accessReason: enrollment.access_reason,
      grantedByAdminName: enrollment.granted_by_admin_id ? profileMap.get(enrollment.granted_by_admin_id) ?? "Admin" : null,
      revokedAt: enrollment.revoked_at,
      createdAt: enrollment.created_at
    })),
    purchases: (purchases ?? []).map((purchase: any) => ({
      id: purchase.id,
      orderId: purchase.shopify_order_id,
      email: purchase.email,
      amountCents: purchase.amount_cents,
      currency: purchase.currency,
      financialStatus: purchase.status,
      processingState: purchase.processing_state,
      processingError: purchase.processing_error,
      createdAt: purchase.created_at
    })),
    pendingAccess: (pendingAccess ?? []).map((entry: any) => ({
      id: entry.id,
      email: entry.email,
      programTitle: programMap.get(entry.program_id)?.title ?? "Program",
      status: entry.status,
      purchaseId: entry.purchase_id,
      resolvedByAdminName: entry.resolved_by_admin_id ? profileMap.get(entry.resolved_by_admin_id) ?? "Admin" : null,
      resolutionNote: entry.resolution_note,
      createdAt: entry.created_at
    })),
    users: (profiles ?? []).map((profile: any) => ({
      id: profile.id,
      fullName: profile.full_name ?? "User",
      email: profile.email ?? null,
      role: profile.role
    }))
  };
}

export async function getAdminProgramContentOverview(): Promise<AdminProgramContentRecord[]> {
  const supabase = await createClient();
  const [
    { data: programs, error: programsError },
    { data: modules, error: modulesError },
    { data: lessons, error: lessonsError },
    { data: lessonTasks, error: lessonTasksError },
    { data: resources, error: resourcesError }
  ] = await Promise.all([
    supabase.from("programs").select("id, title, slug").order("created_at"),
    supabase.from("program_modules").select("id, program_id, title, description, sort_order").order("sort_order"),
    supabase
      .from("program_lessons")
      .select("id, program_id, module_id, title, summary, content, sort_order, estimated_minutes, is_published")
      .order("sort_order"),
    supabase
      .from("lesson_tasks")
      .select("id, lesson_id, title, instructions, task_type, sort_order, is_required, due_date")
      .order("sort_order"),
    supabase
      .from("program_resources")
      .select("id, program_id, module_id, lesson_id, title, description, resource_type, external_url, file_name, bucket, storage_path, is_published")
      .order("created_at")
  ]);

  if (programsError) throw new Error(programsError.message);
  if (modulesError) throw new Error(modulesError.message);
  if (lessonsError) throw new Error(lessonsError.message);
  if (lessonTasksError) throw new Error(lessonTasksError.message);
  if (resourcesError) throw new Error(resourcesError.message);

  return (programs ?? []).map((program: any) => ({
    id: program.id,
    title: program.title,
    slug: program.slug,
    modules: (modules ?? [])
      .filter((module: any) => module.program_id === program.id)
      .map((module: any) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        sortOrder: module.sort_order,
        lessons: (lessons ?? [])
          .filter((lesson: any) => lesson.module_id === module.id)
          .map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            summary: lesson.summary,
            content: lesson.content,
            sortOrder: lesson.sort_order,
            estimatedMinutes: lesson.estimated_minutes,
            isPublished: lesson.is_published,
            tasks: (lessonTasks ?? [])
              .filter((task: any) => task.lesson_id === lesson.id)
              .map((task: any) => ({
                id: task.id,
                title: task.title,
                instructions: task.instructions,
                taskType: task.task_type,
                sortOrder: task.sort_order,
                isRequired: task.is_required,
                dueDate: task.due_date
              }))
          }))
      })),
    resources: (resources ?? [])
      .filter((resource: any) => resource.program_id === program.id)
      .map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        resourceType: resource.resource_type,
        externalUrl: resource.external_url,
        fileName: resource.file_name,
        bucket: resource.bucket,
        storagePath: resource.storage_path,
        moduleId: resource.module_id,
        lessonId: resource.lesson_id,
        isPublished: resource.is_published
      }))
  }));
}

export async function getAdminPurchasesByState(processingState?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("purchases")
    .select("id, shopify_order_id, email, amount_cents, currency, status, processing_state, processing_error, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (processingState && processingState !== "all") {
    query = query.eq("processing_state", processingState);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((purchase: any) => ({
    id: purchase.id,
    orderId: purchase.shopify_order_id,
    email: purchase.email,
    amountCents: purchase.amount_cents,
    currency: purchase.currency,
    financialStatus: purchase.status,
    processingState: purchase.processing_state,
    processingError: purchase.processing_error,
    createdAt: purchase.created_at
  })) as PurchaseRecord[];
}

function getNotificationSeverity(type: string): NotificationRecord["severity"] {
  if (type.includes("overdue")) {
    return "warning";
  }
  if (type.includes("pending_review")) {
    return "success";
  }
  return "info";
}

export async function getUserNotifications(userId: string, limit = 6): Promise<NotificationRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, action_href, status, email_status, created_at, read_at, archived_at, metadata")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((notification: any) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    actionHref: notification.action_href,
    status: notification.status,
    emailStatus: notification.email_status,
    createdAt: notification.created_at,
    readAt: notification.read_at,
    archivedAt: notification.archived_at,
    severity: getNotificationSeverity(notification.type)
  })) as NotificationRecord[];
}

export async function getUserNotificationUnreadCount(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "unread")
    .is("archived_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getUserNotificationPreferences(userId: string, role: UserRole): Promise<NotificationPreferenceRecord[]> {
  const supabase = await createClient();
  const catalog = (await supabase
    .from("notification_settings")
    .select("type, label, description, audience, is_enabled, in_app_enabled, email_enabled")
    .eq("audience", role)
    .order("type"));
  const preferences = await supabase
    .from("notification_user_preferences")
    .select("type, in_app_enabled, email_enabled")
    .eq("user_id", userId);

  if (catalog.error) {
    throw new Error(catalog.error.message);
  }
  if (preferences.error) {
    throw new Error(preferences.error.message);
  }

  const preferenceMap = new Map<string, { inAppEnabled: boolean; emailEnabled: boolean }>(
    (preferences.data ?? []).map((row: any) => [
      row.type,
      {
        inAppEnabled: row.in_app_enabled,
        emailEnabled: row.email_enabled
      }
    ])
  );

  return (catalog.data ?? []).map((setting: any) => ({
    type: setting.type,
    label: setting.label,
    description: setting.description,
    audience: setting.audience,
    globalEnabled: setting.is_enabled,
    globalInAppEnabled: setting.in_app_enabled,
    globalEmailEnabled: setting.email_enabled,
    inAppEnabled: setting.is_enabled && setting.in_app_enabled && (preferenceMap.get(setting.type)?.inAppEnabled ?? true),
    emailEnabled: setting.is_enabled && setting.email_enabled && (preferenceMap.get(setting.type)?.emailEnabled ?? false)
  }));
}

export async function getAdminNotificationOverview(): Promise<{
  settings: NotificationSettingRecord[];
  history: AdminNotificationHistoryRecord[];
  runs: NotificationRunRecord[];
}> {
  const supabase = await createClient();
  const [
    { data: settings, error: settingsError },
    { data: history, error: historyError },
    { data: profiles, error: profilesError },
    { data: runs, error: runsError }
  ] = await Promise.all([
    supabase
      .from("notification_settings")
      .select("type, label, description, audience, is_enabled, in_app_enabled, email_enabled, updated_at")
      .order("type"),
    supabase
      .from("notifications")
      .select("id, user_id, role, type, title, body, action_href, status, email_status, email_error, created_at, read_at, archived_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("profiles").select("id, full_name, email"),
    supabase
      .from("notification_runs")
      .select("id, trigger_source, status, started_at, completed_at, users_processed, notifications_created, emails_attempted, emails_sent, emails_failed, summary, error_message")
      .order("started_at", { ascending: false })
      .limit(10)
  ]);

  if (settingsError) {
    throw new Error(settingsError.message);
  }
  if (historyError) {
    throw new Error(historyError.message);
  }
  if (profilesError) {
    throw new Error(profilesError.message);
  }
  if (runsError) {
    throw new Error(runsError.message);
  }

  const profileMap = new Map<string, { name: string; email: string | null }>(
    (profiles ?? []).map((profile: any) => [
      profile.id,
      {
        name: profile.full_name ?? "User",
        email: profile.email ?? null
      }
    ])
  );

  return {
    settings: (settings ?? []).map((setting: any) => ({
      type: setting.type,
      label: setting.label,
      description: setting.description,
      audience: setting.audience,
      isEnabled: setting.is_enabled,
      inAppEnabled: setting.in_app_enabled,
      emailEnabled: setting.email_enabled,
      updatedAt: setting.updated_at
    })),
    history: (history ?? []).map((notification: any) => ({
      id: notification.id,
      userId: notification.user_id,
      userName: profileMap.get(notification.user_id)?.name ?? "User",
      userEmail: profileMap.get(notification.user_id)?.email ?? null,
      role: notification.role,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      actionHref: notification.action_href,
      status: notification.status,
      emailStatus: notification.email_status,
      emailError: notification.email_error,
      createdAt: notification.created_at,
      readAt: notification.read_at
      ,
      archivedAt: notification.archived_at
    })),
    runs: (runs ?? []).map((run: any) => ({
      id: run.id,
      triggerSource: run.trigger_source,
      status: run.status,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      usersProcessed: run.users_processed,
      notificationsCreated: run.notifications_created,
      emailsAttempted: run.emails_attempted,
      emailsSent: run.emails_sent,
      emailsFailed: run.emails_failed,
      summary: run.summary,
      errorMessage: run.error_message
    }))
  };
}
