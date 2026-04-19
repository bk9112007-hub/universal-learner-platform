"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export type NotificationActionState = {
  error?: string;
  success?: string;
};

const preferenceSchema = z.object({
  type: z.string().min(1),
  inAppEnabled: z.enum(["true", "false"]),
  emailEnabled: z.enum(["true", "false"])
});

const notificationIdSchema = z.object({
  notificationId: z.string().uuid()
});

function revalidateNotificationSurfaces(role: string | null) {
  revalidatePath("/app/student");
  revalidatePath("/app/teacher");
  revalidatePath("/app/parent");
  revalidatePath("/app/admin");
  if (role === "student") revalidatePath("/app/student");
  if (role === "teacher") revalidatePath("/app/teacher");
  if (role === "parent") revalidatePath("/app/parent");
}

export async function updateNotificationPreferenceAction(
  _: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  const parsed = preferenceSchema.safeParse({
    type: formData.get("type"),
    inAppEnabled: String(formData.get("inAppEnabled") ?? "false"),
    emailEnabled: String(formData.get("emailEnabled") ?? "false")
  });

  if (!parsed.success) {
    return { error: "Please provide valid notification preference values." };
  }

  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile) {
    return { error: "You must be signed in to update notification preferences." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("notification_user_preferences").upsert(
    {
      user_id: user.id,
      type: parsed.data.type,
      in_app_enabled: parsed.data.inAppEnabled === "true",
      email_enabled: parsed.data.emailEnabled === "true"
    },
    { onConflict: "user_id,type" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidateNotificationSurfaces(profile.role);
  return { success: "Notification preference updated." };
}

export async function markNotificationReadAction(
  _: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  const parsed = notificationIdSchema.safeParse({
    notificationId: formData.get("notificationId")
  });

  if (!parsed.success) {
    return { error: "Notification id is required." };
  }

  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile) {
    return { error: "You must be signed in to update notifications." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      status: "read",
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", parsed.data.notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidateNotificationSurfaces(profile.role);
  return { success: "Notification marked as read." };
}

export async function archiveNotificationAction(
  _: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  const parsed = notificationIdSchema.safeParse({
    notificationId: formData.get("notificationId")
  });

  if (!parsed.success) {
    return { error: "Notification id is required." };
  }

  const { user, profile } = await getProfileForCurrentUser();
  if (!user || !profile) {
    return { error: "You must be signed in to update notifications." };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      status: "read",
      read_at: now,
      archived_at: now,
      updated_at: now
    })
    .eq("id", parsed.data.notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidateNotificationSurfaces(profile.role);
  return { success: "Notification archived." };
}
