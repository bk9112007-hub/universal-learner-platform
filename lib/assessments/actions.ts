"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export type AssessmentActionState = {
  error?: string;
  success?: string;
};

const createAssessmentSchema = z.object({
  studentId: z.string().uuid(),
  title: z.string().min(3).max(120),
  subject: z.string().min(2).max(80),
  description: z.string().min(10).max(1200),
  dueDate: z.string().optional()
});

const gradeAssessmentSchema = z.object({
  assessmentId: z.string().uuid(),
  score: z.coerce.number().min(0).max(100),
  teacherComment: z.string().min(10).max(2000)
});

export async function createAssessmentAction(
  _: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const parsed = createAssessmentSchema.safeParse({
    studentId: formData.get("studentId"),
    title: formData.get("title"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate") || undefined
  });

  if (!parsed.success) {
    return { error: "Please complete all required assessment fields." };
  }

  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile || !["teacher", "admin"].includes(profile.role)) {
    return { error: "Only teachers and admins can create assessments." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assessments").insert({
    student_id: parsed.data.studentId,
    teacher_id: user.id,
    title: parsed.data.title,
    subject: parsed.data.subject,
    description: parsed.data.description,
    due_date: parsed.data.dueDate || null,
    status: "assigned"
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/teacher");
  revalidatePath("/app/student");
  revalidatePath("/app/parent");

  return { success: "Assessment created successfully." };
}

export async function gradeAssessmentAction(
  _: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const parsed = gradeAssessmentSchema.safeParse({
    assessmentId: formData.get("assessmentId"),
    score: formData.get("score"),
    teacherComment: formData.get("teacherComment")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid score and teacher comment." };
  }

  const { profile } = await getProfileForCurrentUser();
  if (!profile || !["teacher", "admin"].includes(profile.role)) {
    return { error: "Only teachers and admins can grade assessments." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assessments")
    .update({
      score: parsed.data.score,
      teacher_comment: parsed.data.teacherComment,
      status: "graded"
    })
    .eq("id", parsed.data.assessmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/teacher");
  revalidatePath("/app/student");
  revalidatePath("/app/parent");

  return { success: "Assessment graded successfully." };
}

export async function deleteAssessmentAction(
  _: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const assessmentId = String(formData.get("assessmentId") ?? "");

  if (!assessmentId) {
    return { error: "Assessment id is required." };
  }

  const { profile } = await getProfileForCurrentUser();
  if (!profile || !["teacher", "admin"].includes(profile.role)) {
    return { error: "Only teachers and admins can delete assessments." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assessments").delete().eq("id", assessmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/teacher");
  revalidatePath("/app/student");
  revalidatePath("/app/parent");

  return { success: "Assessment deleted successfully." };
}
