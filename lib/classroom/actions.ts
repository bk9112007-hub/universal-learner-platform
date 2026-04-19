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
