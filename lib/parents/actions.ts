"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export type ParentLinkActionState = {
  error?: string;
  success?: string;
};

const linkChildSchema = z.object({
  childEmail: z.string().email()
});

export async function linkChildToParentAction(
  _: ParentLinkActionState,
  formData: FormData
): Promise<ParentLinkActionState> {
  const parsed = linkChildSchema.safeParse({
    childEmail: formData.get("childEmail")
  });

  if (!parsed.success) {
    return { error: "Enter a valid child email address." };
  }

  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile || !["parent", "admin"].includes(profile.role)) {
    return { error: "Only parents and admins can create child links." };
  }

  const supabase = await createClient();
  const { data: childProfile, error: childProfileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", parsed.data.childEmail.toLowerCase())
    .single();

  if (childProfileError) {
    return { error: childProfileError.message };
  }
  if (childProfile.role !== "student") {
    return { error: "That account is not a student profile." };
  }

  const { error } = await supabase.from("parent_student_links").upsert({
    parent_id: user.id,
    student_id: childProfile.id
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/parent");

  return { success: "Child linked successfully." };
}
