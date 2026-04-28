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
  const { data, error } = await supabase.rpc("link_child_to_parent_by_email", {
    target_email: parsed.data.childEmail.toLowerCase()
  });

  if (error) {
    return { error: "We could not link that child account right now. Please try again." };
  }

  const result = data?.[0];

  if (!result) {
    return { error: "We could not link that child account right now. Please try again." };
  }

  if (result.status === "linked") {
    revalidatePath("/app/parent");
    return { success: "Child linked successfully." };
  }

  if (result.status === "not_found") {
    return { error: "No student account was found for that email address." };
  }

  if (result.status === "not_student") {
    return { error: "That account is not a student profile." };
  }

  if (result.status === "forbidden") {
    return { error: "You are not allowed to link a child account right now." };
  }

  return { error: "We could not link that child account right now. Please try again." };
}
