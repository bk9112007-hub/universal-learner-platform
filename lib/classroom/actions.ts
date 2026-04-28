"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export type ClassroomActionState = {
  error?: string;
  success?: string;
};

const cohortSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(3).max(1000),
  programId: z.string().uuid().optional()
});

const assignmentSchema = z.object({
  studentId: z.string().uuid(),
  cohortId: z.string().uuid().optional()
});

async function requireTeacherOrAdmin() {
  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile || !["teacher", "admin"].includes(profile.role)) {
    throw new Error("Only teachers and admins can manage classrooms.");
  }

  return { user, profile };
}

function revalidateClassroomSurfaces() {
  revalidatePath("/app/teacher");
  revalidatePath("/app/student");
  revalidatePath("/app/parent");
  revalidatePath("/app/programs");
}

export async function createCohortAction(_: ClassroomActionState, formData: FormData): Promise<ClassroomActionState> {
  let actor;
  try {
    actor = await requireTeacherOrAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = cohortSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    programId: formData.get("programId") || undefined
  });

  if (!parsed.success) {
    return { error: "Please provide a valid cohort title, description, and optional program." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cohorts").insert({
    teacher_id: actor.user.id,
    program_id: parsed.data.programId ?? null,
    title: parsed.data.title,
    description: parsed.data.description
  });

  if (error) {
    return { error: error.message };
  }

  revalidateClassroomSurfaces();
  return { success: "Cohort created." };
}

export async function assignLearnerAction(_: ClassroomActionState, formData: FormData): Promise<ClassroomActionState> {
  let actor;
  try {
    actor = await requireTeacherOrAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = assignmentSchema.safeParse({
    studentId: formData.get("studentId"),
    cohortId: formData.get("cohortId") || undefined
  });

  if (!parsed.success) {
    return { error: "Please choose a learner and optional cohort." };
  }

  const supabase = await createClient();
  const { data: studentProfile, error: studentError } = await supabase
    .from("profiles")
    .select("id, role, role_source")
    .eq("id", parsed.data.studentId)
    .maybeSingle();

  if (studentError) {
    return { error: studentError.message };
  }

  if (!studentProfile) {
    return { error: "That learner account is incomplete right now. Repair the student profile before assigning them." };
  }

  if (studentProfile.role !== "student") {
    return { error: "Only student accounts can be assigned to a teacher." };
  }

  if (studentProfile.role_source !== "explicit") {
    return { error: "That learner still needs to complete role setup before assignment." };
  }

  const { data: existingAssignment, error: assignmentLookupError } = await supabase
    .from("teacher_student_assignments")
    .select("id, cohort_id")
    .eq("teacher_id", actor.user.id)
    .eq("student_id", parsed.data.studentId)
    .maybeSingle();

  if (assignmentLookupError) {
    return { error: assignmentLookupError.message };
  }

  if (existingAssignment && existingAssignment.cohort_id === (parsed.data.cohortId ?? null)) {
    return { error: "This learner is already assigned with that cohort selection." };
  }

  const { error } = await supabase.from("teacher_student_assignments").upsert(
    {
      teacher_id: actor.user.id,
      student_id: parsed.data.studentId,
      cohort_id: parsed.data.cohortId ?? null
    },
    { onConflict: "teacher_id,student_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidateClassroomSurfaces();
  return { success: "Learner assigned." };
}
