"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { buildAiQuizDraft, gradeQuizResponses, parseQuizDraft } from "@/lib/assessments/engine";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export type AssessmentActionState = {
  error?: string;
  success?: string;
};

const assignmentTargetSchema = z.object({
  targetType: z.enum(["student", "cohort"]),
  targetId: z.string().uuid()
});

const manualQuizSchema = assignmentTargetSchema.extend({
  title: z.string().min(3).max(120),
  subject: z.string().min(2).max(80),
  topic: z.string().min(2).max(120),
  description: z.string().min(10).max(1200),
  dueDate: z.string().optional(),
  questionsPayload: z.string().min(2)
});

const aiQuizSchema = assignmentTargetSchema.extend({
  subject: z.string().min(2).max(80),
  topic: z.string().min(2).max(120),
  difficulty: z.enum(["foundational", "intermediate", "advanced"]),
  questionCount: z.coerce.number().min(3).max(8),
  dueDate: z.string().optional()
});

const submitQuizSchema = z.object({
  assessmentId: z.string().uuid(),
  responsesPayload: z.string().min(2)
});

const reviewQuizSchema = z.object({
  assessmentId: z.string().uuid(),
  teacherComment: z.string().min(10).max(2000),
  overrideScore: z.string().optional()
});

const deleteAssessmentSchema = z.object({
  assessmentId: z.string().uuid()
});

async function requireTeacherOrAdmin() {
  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile || !["teacher", "admin"].includes(profile.role)) {
    throw new Error("Only teachers and admins can manage quizzes.");
  }

  return { user, profile };
}

async function resolveAssignedStudentIds(targetType: "student" | "cohort", targetId: string, teacherId: string, role: string) {
  const supabase = await createClient();

  if (targetType === "student") {
    if (role === "admin") {
      return [targetId];
    }

    const { data, error } = await supabase
      .from("teacher_student_assignments")
      .select("student_id")
      .eq("teacher_id", teacherId)
      .eq("student_id", targetId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("You can only assign quizzes to learners in your scope.");
    }

    return [targetId];
  }

  let query = supabase.from("teacher_student_assignments").select("student_id").eq("cohort_id", targetId);
  if (role === "teacher") {
    query = query.eq("teacher_id", teacherId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const studentIds = (data ?? []).map((row: any) => row.student_id);
  if (studentIds.length === 0) {
    throw new Error("This cohort does not have any assigned learners yet.");
  }

  return studentIds;
}

async function createQuizAssignments(input: {
  teacherId: string;
  role: string;
  targetType: "student" | "cohort";
  targetId: string;
  dueDate?: string;
  draft: ReturnType<typeof parseQuizDraft>;
}) {
  const supabase = await createClient();
  const studentIds = await resolveAssignedStudentIds(input.targetType, input.targetId, input.teacherId, input.role);

  for (const studentId of studentIds) {
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({
        student_id: studentId,
        teacher_id: input.teacherId,
        title: input.draft.title,
        subject: input.draft.subject,
        topic: input.draft.topic,
        description: input.draft.description,
        due_date: input.dueDate || null,
        status: "assigned",
        source: input.draft.source,
        cohort_id: input.targetType === "cohort" ? input.targetId : null
      })
      .select("id")
      .single();

    if (assessmentError || !assessment) {
      throw new Error(assessmentError?.message ?? "Unable to create the quiz assignment.");
    }

    const { error: questionError } = await supabase.from("assessment_questions").insert(
      input.draft.questions.map((question, index) => ({
        assessment_id: assessment.id,
        prompt: question.prompt,
        question_type: question.questionType,
        topic: question.topic,
        sort_order: index,
        points: question.points,
        options: question.options,
        correct_answer: question.correctAnswer,
        correct_answer_keywords: question.correctAnswerKeywords,
        explanation: question.explanation
      }))
    );

    if (questionError) {
      throw new Error(questionError.message);
    }
  }
}

function revalidateAssessmentSurfaces() {
  revalidatePath("/app/student");
  revalidatePath("/app/teacher");
  revalidatePath("/app/parent");
}

export async function createManualQuizAction(
  _: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const parsed = manualQuizSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    title: formData.get("title"),
    subject: formData.get("subject"),
    topic: formData.get("topic"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate") || undefined,
    questionsPayload: formData.get("questionsPayload")
  });

  if (!parsed.success) {
    return { error: "Please complete the quiz title, assignment target, and all question fields." };
  }

  try {
    const { user, profile } = await requireTeacherOrAdmin();
    const draft = parseQuizDraft(
      JSON.stringify({
        title: parsed.data.title,
        subject: parsed.data.subject,
        topic: parsed.data.topic,
        description: parsed.data.description,
        source: "manual",
        questions: JSON.parse(parsed.data.questionsPayload)
      })
    );

    await createQuizAssignments({
      teacherId: user.id,
      role: profile.role,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      dueDate: parsed.data.dueDate,
      draft
    });

    revalidateAssessmentSurfaces();
    return { success: "Quiz created and assigned successfully." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create the quiz right now." };
  }
}

export async function generateQuizWithAiAction(
  _: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const parsed = aiQuizSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    subject: formData.get("subject"),
    topic: formData.get("topic"),
    difficulty: formData.get("difficulty"),
    questionCount: formData.get("questionCount"),
    dueDate: formData.get("dueDate") || undefined
  });

  if (!parsed.success) {
    return { error: "Please complete the AI quiz generation fields." };
  }

  try {
    const { user, profile } = await requireTeacherOrAdmin();
    const draft = buildAiQuizDraft({
      subject: parsed.data.subject,
      topic: parsed.data.topic,
      difficulty: parsed.data.difficulty,
      questionCount: parsed.data.questionCount
    });

    await createQuizAssignments({
      teacherId: user.id,
      role: profile.role,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      dueDate: parsed.data.dueDate,
      draft
    });

    revalidateAssessmentSurfaces();
    return { success: "AI-generated quiz created and assigned successfully." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to generate the quiz right now." };
  }
}

export async function submitQuizAttemptAction(
  _: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const parsed = submitQuizSchema.safeParse({
    assessmentId: formData.get("assessmentId"),
    responsesPayload: formData.get("responsesPayload")
  });

  if (!parsed.success) {
    return { error: "Quiz responses could not be submitted." };
  }

  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile || profile.role !== "student") {
    return { error: "Only students can complete quizzes." };
  }

  try {
    const supabase = await createClient();
    const responseMap = JSON.parse(parsed.data.responsesPayload) as Record<string, string>;

    const [{ data: assessment, error: assessmentError }, { data: questions, error: questionsError }] = await Promise.all([
      supabase
        .from("assessments")
        .select("id, student_id, status")
        .eq("id", parsed.data.assessmentId)
        .eq("student_id", user.id)
        .single(),
      supabase
        .from("assessment_questions")
        .select("id, prompt, question_type, topic, points, options, correct_answer, correct_answer_keywords, explanation")
        .eq("assessment_id", parsed.data.assessmentId)
        .order("sort_order")
    ]);

    if (assessmentError || !assessment) {
      throw new Error(assessmentError?.message ?? "Quiz assignment not found.");
    }
    if (questionsError) {
      throw new Error(questionsError.message);
    }

    const grading = gradeQuizResponses({
      questions: (questions ?? []).map((question: any) => ({
        id: question.id,
        prompt: question.prompt,
        questionType: question.question_type,
        topic: question.topic,
        points: question.points,
        options: Array.isArray(question.options) ? question.options : [],
        correctAnswer: question.correct_answer,
        correctAnswerKeywords: Array.isArray(question.correct_answer_keywords) ? question.correct_answer_keywords : [],
        explanation: question.explanation ?? ""
      })),
      responses: responseMap
    });

    const { error: responseError } = await supabase.from("assessment_responses").upsert(
      grading.responses.map((response) => ({
        assessment_id: parsed.data.assessmentId,
        question_id: response.questionId,
        student_id: user.id,
        response_text: response.responseText,
        is_correct: response.isCorrect,
        score_awarded: response.scoreAwarded,
        ai_feedback: response.aiFeedback
      })),
      { onConflict: "assessment_id,question_id,student_id" }
    );

    if (responseError) {
      throw new Error(responseError.message);
    }

    const { error: updateError } = await supabase
      .from("assessments")
      .update({
        status: "submitted",
        ai_score: grading.aiScore,
        score: grading.score,
        ai_feedback: grading.aiFeedback,
        weak_topics: grading.weakTopics,
        completed_at: new Date().toISOString()
      })
      .eq("id", parsed.data.assessmentId)
      .eq("student_id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidateAssessmentSurfaces();
    revalidatePath(`/app/student/quizzes/${parsed.data.assessmentId}`);
    return { success: "Quiz submitted. AI grading is ready for review." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to submit the quiz right now." };
  }
}

export async function reviewQuizAssessmentAction(
  _: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const parsed = reviewQuizSchema.safeParse({
    assessmentId: formData.get("assessmentId"),
    teacherComment: formData.get("teacherComment"),
    overrideScore: formData.get("overrideScore") || undefined
  });

  if (!parsed.success) {
    return { error: "Please provide teacher feedback and an optional override score." };
  }

  try {
    const { user } = await requireTeacherOrAdmin();
    const supabase = await createClient();
    const overrideScore =
      parsed.data.overrideScore && parsed.data.overrideScore.trim().length > 0 ? Number(parsed.data.overrideScore) : null;

    if (overrideScore !== null && (!Number.isFinite(overrideScore) || overrideScore < 0 || overrideScore > 100)) {
      return { error: "Override score must be between 0 and 100." };
    }

    const { error } = await supabase
      .from("assessments")
      .update({
        status: "graded",
        teacher_comment: parsed.data.teacherComment,
        teacher_override_score: overrideScore,
        score: overrideScore ?? undefined,
        reviewed_at: new Date().toISOString(),
        teacher_id: user.id
      })
      .eq("id", parsed.data.assessmentId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateAssessmentSurfaces();
    return { success: "Quiz review saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to save the quiz review right now." };
  }
}

export async function deleteAssessmentAction(
  _: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const parsed = deleteAssessmentSchema.safeParse({
    assessmentId: formData.get("assessmentId")
  });

  if (!parsed.success) {
    return { error: "Assessment id is required." };
  }

  try {
    await requireTeacherOrAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("assessments").delete().eq("id", parsed.data.assessmentId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateAssessmentSurfaces();
    return { success: "Quiz deleted successfully." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to delete the quiz right now." };
  }
}
