import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { AssessmentRecord, QuizQuestionRecord, TeacherQuizAnalyticsRecord, TeacherStudentOptionRecord } from "@/types/domain";

async function getAssessmentQuestionCounts(assessmentIds: string[]) {
  if (assessmentIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("assessment_questions").select("assessment_id").in("assessment_id", assessmentIds);
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((map: Map<string, number>, row: any) => {
    map.set(row.assessment_id, (map.get(row.assessment_id) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
}

export const getTeacherQuizScope = cache(async (userId: string, role: string) => {
  const supabase = await createClient();

  if (role === "admin") {
    return {
      assignedStudentIds: [] as string[],
      cohortIds: [] as string[]
    };
  }

  const { data, error } = await supabase
    .from("teacher_student_assignments")
    .select("student_id, cohort_id")
    .eq("teacher_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    assignedStudentIds: Array.from(new Set((data ?? []).map((row: any) => row.student_id))),
    cohortIds: Array.from(new Set((data ?? []).map((row: any) => row.cohort_id).filter(Boolean)))
  };
});

function mapAssessmentRow(
  assessment: any,
  studentName: string | null,
  questionCount: number
): AssessmentRecord {
  return {
    id: assessment.id,
    title: assessment.title,
    subject: assessment.subject,
    description: assessment.description,
    status: assessment.status,
    dueDate: assessment.due_date,
    assignedAt: assessment.created_at,
    score: assessment.score,
    aiScore: assessment.ai_score ?? null,
    teacherOverrideScore: assessment.teacher_override_score ?? null,
    aiFeedback: assessment.ai_feedback ?? null,
    teacherComment: assessment.teacher_comment ?? null,
    studentId: assessment.student_id,
    studentName,
    teacherId: assessment.teacher_id,
    topic: assessment.topic ?? null,
    source: assessment.source ?? "manual",
    cohortId: assessment.cohort_id ?? null,
    questionCount,
    weakTopics: Array.isArray(assessment.weak_topics) ? assessment.weak_topics : []
  };
}

export async function getTeacherQuizAssignments(userId: string, role: string): Promise<AssessmentRecord[]> {
  const supabase = await createClient();
  const scope = await getTeacherQuizScope(userId, role);

  let query = supabase
    .from("assessments")
    .select(
      "id, student_id, teacher_id, title, subject, topic, description, status, due_date, score, ai_score, teacher_override_score, ai_feedback, teacher_comment, weak_topics, source, cohort_id, created_at"
    )
    .order("created_at", { ascending: false });

  if (role === "teacher") {
    if (scope.assignedStudentIds.length === 0) {
      return [];
    }
    query = query.in("student_id", scope.assignedStudentIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const studentIds = Array.from(new Set((data ?? []).map((row: any) => row.student_id)));
  const [{ data: profiles, error: profilesError }, questionCounts] = await Promise.all([
    studentIds.length ? supabase.from("profiles").select("id, full_name").in("id", studentIds) : Promise.resolve({ data: [], error: null }),
    getAssessmentQuestionCounts((data ?? []).map((row: any) => row.id))
  ]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const studentMap = new Map<string, string>((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));
  return (data ?? []).map((assessment: any) => mapAssessmentRow(assessment, studentMap.get(assessment.student_id) ?? "Student", questionCounts.get(assessment.id) ?? 0));
}

export async function getStudentQuizAssignments(studentId: string): Promise<AssessmentRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select(
      "id, student_id, teacher_id, title, subject, topic, description, status, due_date, score, ai_score, teacher_override_score, ai_feedback, teacher_comment, weak_topics, source, cohort_id, created_at"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const questionCounts = await getAssessmentQuestionCounts((data ?? []).map((row: any) => row.id));
  return (data ?? []).map((assessment: any) => mapAssessmentRow(assessment, null, questionCounts.get(assessment.id) ?? 0));
}

export async function getQuizQuestionsForStudent(assessmentId: string, studentId: string): Promise<{
  assessment: AssessmentRecord | null;
  questions: QuizQuestionRecord[];
}> {
  const supabase = await createClient();
  const [{ data: assessment, error: assessmentError }, { data: questions, error: questionsError }, { data: responses, error: responsesError }] =
    await Promise.all([
      supabase
        .from("assessments")
        .select(
          "id, student_id, teacher_id, title, subject, topic, description, status, due_date, score, ai_score, teacher_override_score, ai_feedback, teacher_comment, weak_topics, source, cohort_id, created_at"
        )
        .eq("id", assessmentId)
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("assessment_questions")
        .select("id, assessment_id, prompt, question_type, topic, sort_order, points, options, explanation")
        .eq("assessment_id", assessmentId)
        .order("sort_order"),
      supabase
        .from("assessment_responses")
        .select("question_id, response_text, is_correct, score_awarded, ai_feedback")
        .eq("assessment_id", assessmentId)
        .eq("student_id", studentId)
    ]);

  if (assessmentError) {
    throw new Error(assessmentError.message);
  }
  if (questionsError) {
    throw new Error(questionsError.message);
  }
  if (responsesError) {
    throw new Error(responsesError.message);
  }

  if (!assessment) {
    return { assessment: null, questions: [] };
  }

  const responseMap = new Map<string, any>((responses ?? []).map((response: any) => [response.question_id, response]));

  return {
    assessment: mapAssessmentRow(assessment, null, (questions ?? []).length),
    questions: (questions ?? []).map((question: any) => {
      const response = responseMap.get(question.id);
      return {
        id: question.id,
        assessmentId: question.assessment_id,
        prompt: question.prompt,
        questionType: question.question_type,
        topic: question.topic,
        sortOrder: question.sort_order,
        points: question.points,
        options: Array.isArray(question.options) ? question.options : [],
        explanation: question.explanation ?? null,
        responseText: response?.response_text ?? null,
        isCorrect: response?.is_correct ?? null,
        scoreAwarded: response?.score_awarded ?? null,
        aiFeedback: response?.ai_feedback ?? null
      };
    })
  };
}

export async function getTeacherQuizAnalytics(userId: string, role: string): Promise<TeacherQuizAnalyticsRecord[]> {
  const assessments = await getTeacherQuizAssignments(userId, role);
  const topicMap = new Map<string, { misses: number; learners: Set<string> }>();

  assessments.forEach((assessment) => {
    assessment.weakTopics.forEach((topic) => {
      const existing = topicMap.get(topic) ?? { misses: 0, learners: new Set<string>() };
      existing.misses += 1;
      existing.learners.add(assessment.studentId);
      topicMap.set(topic, existing);
    });
  });

  return Array.from(topicMap.entries())
    .map(([topic, value]) => ({
      topic,
      missCount: value.misses,
      learnerCount: value.learners.size
    }))
    .sort((left, right) => right.missCount - left.missCount)
    .slice(0, 6);
}

export async function getParentLinkedQuizResults(parentId: string): Promise<Array<{ studentId: string; studentName: string; quizzes: AssessmentRecord[] }>> {
  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase.from("parent_student_links").select("student_id").eq("parent_id", parentId);

  if (linksError) {
    throw new Error(linksError.message);
  }

  const studentIds = (links ?? []).map((link: any) => link.student_id);
  if (studentIds.length === 0) {
    return [];
  }

  const [{ data: profiles, error: profilesError }, { data: assessments, error: assessmentsError }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", studentIds),
    supabase
      .from("assessments")
      .select(
        "id, student_id, teacher_id, title, subject, topic, description, status, due_date, score, ai_score, teacher_override_score, ai_feedback, teacher_comment, weak_topics, source, cohort_id, created_at"
      )
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
  ]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }
  if (assessmentsError) {
    throw new Error(assessmentsError.message);
  }

  const questionCounts = await getAssessmentQuestionCounts((assessments ?? []).map((row: any) => row.id));
  const profileMap = new Map<string, string>((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));

  return studentIds.map((studentId: string) => ({
    studentId,
    studentName: profileMap.get(studentId) ?? "Student",
    quizzes: (assessments ?? [])
      .filter((assessment: any) => assessment.student_id === studentId)
      .map((assessment: any) => mapAssessmentRow(assessment, profileMap.get(studentId) ?? "Student", questionCounts.get(assessment.id) ?? 0))
  }));
}

export async function getQuizAssignmentTargets(userId: string, role: string): Promise<{
  students: TeacherStudentOptionRecord[];
  cohorts: Array<{ id: string; title: string }>;
}> {
  const supabase = await createClient();

  if (role === "admin") {
    const [{ data: students, error: studentsError }, { data: cohorts, error: cohortsError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name"),
      supabase.from("cohorts").select("id, title").order("title")
    ]);

    if (studentsError) throw new Error(studentsError.message);
    if (cohortsError) throw new Error(cohortsError.message);

    return {
      students: (students ?? []).map((student: any) => ({
        id: student.id,
        fullName: student.full_name ?? "Student",
        cohortId: null,
        cohortTitle: null
      })),
      cohorts: (cohorts ?? []).map((cohort: any) => ({ id: cohort.id, title: cohort.title }))
    };
  }

  const [{ data: assignments, error: assignmentsError }, { data: cohorts, error: cohortsError }] = await Promise.all([
    supabase.from("teacher_student_assignments").select("student_id, cohort_id").eq("teacher_id", userId),
    supabase.from("cohorts").select("id, title").eq("teacher_id", userId).order("title")
  ]);

  if (assignmentsError) throw new Error(assignmentsError.message);
  if (cohortsError) throw new Error(cohortsError.message);

  const studentIds = Array.from(new Set((assignments ?? []).map((assignment: any) => assignment.student_id)));
  const cohortMap = new Map<string, string>((cohorts ?? []).map((cohort: any) => [cohort.id, cohort.title]));
  const { data: profiles, error: profilesError } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [], error: null };

  if (profilesError) throw new Error(profilesError.message);

  const profileMap = new Map<string, string>((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? "Student"]));

  return {
    students: (assignments ?? []).map((assignment: any) => ({
      id: assignment.student_id,
      fullName: profileMap.get(assignment.student_id) ?? "Student",
      cohortId: assignment.cohort_id ?? null,
      cohortTitle: assignment.cohort_id ? cohortMap.get(assignment.cohort_id) ?? null : null
    })),
    cohorts: (cohorts ?? []).map((cohort: any) => ({ id: cohort.id, title: cohort.title }))
  };
}
