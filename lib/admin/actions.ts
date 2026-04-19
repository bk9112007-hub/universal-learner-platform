"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { NOTIFICATION_CATALOG } from "@/lib/notifications/catalog";
import { retryNotificationDelivery, syncNotificationsForAllUsers } from "@/lib/notifications/service";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { processShopifyOrderWebhook } from "@/lib/shopify/webhook-processing";
import { getProgramResourcesBucket } from "@/lib/storage/program-resources";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActionState = {
  error?: string;
  success?: string;
};

const programSchema = z.object({
  programId: z.string().optional(),
  title: z.string().min(3).max(120),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(2000),
  priceCents: z.coerce.number().min(0),
  shopifyProductId: z.string().trim().optional(),
  isActive: z.enum(["true", "false"])
});

const grantEnrollmentSchema = z.object({
  programId: z.string().uuid(),
  userId: z.string().uuid(),
  accessReason: z.string().min(3).max(300)
});

const revokeEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid(),
  revokeReason: z.string().min(3).max(300)
});

const resolvePendingSchema = z.object({
  pendingId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  resolutionNote: z.string().min(3).max(300)
});

const retryPurchaseSchema = z.object({
  purchaseId: z.string().uuid()
});

const notificationTypeValues = new Set(NOTIFICATION_CATALOG.map((entry) => entry.type));

const notificationSettingSchema = z.object({
  type: z.string().refine((value) => notificationTypeValues.has(value as any), "Invalid notification type"),
  isEnabled: z.enum(["true", "false"]),
  inAppEnabled: z.enum(["true", "false"]),
  emailEnabled: z.enum(["true", "false"])
});

const retryNotificationSchema = z.object({
  notificationId: z.string().uuid()
});

const programModuleSchema = z.object({
  moduleId: z.string().uuid().optional(),
  programId: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().min(3).max(1000),
  sortOrder: z.coerce.number().int().min(0)
});

const programLessonSchema = z.object({
  lessonId: z.string().uuid().optional(),
  programId: z.string().uuid(),
  moduleId: z.string().uuid(),
  title: z.string().min(3).max(120),
  summary: z.string().min(3).max(500),
  content: z.string().min(10).max(12000),
  sortOrder: z.coerce.number().int().min(0),
  estimatedMinutes: z.coerce.number().int().min(1).max(600),
  isPublished: z.enum(["true", "false"])
});

const lessonTaskSchema = z.object({
  taskId: z.string().uuid().optional(),
  lessonId: z.string().uuid(),
  title: z.string().min(3).max(120),
  instructions: z.string().min(3).max(3000),
  taskType: z.enum(["checkpoint", "submission"]),
  sortOrder: z.coerce.number().int().min(0),
  dueDate: z.string().optional(),
  isRequired: z.enum(["true", "false"])
});

const programResourceSchema = z.object({
  resourceId: z.string().uuid().optional(),
  programId: z.string().uuid(),
  moduleId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  title: z.string().min(3).max(120),
  description: z.string().min(3).max(1000),
  resourceType: z.enum(["link", "file"]),
  externalUrl: z.string().trim().optional(),
  isPublished: z.enum(["true", "false"]),
  existingBucket: z.string().optional(),
  existingStoragePath: z.string().optional(),
  existingFileName: z.string().optional()
});

async function requireAdmin() {
  const { profile, user } = await getProfileForCurrentUser();
  if (!user || !profile || profile.role !== "admin") {
    throw new Error("Only admins can run this action.");
  }

  return { user, profile };
}

function revalidateAdminSurfaces() {
  revalidatePath("/app/admin");
  revalidatePath("/app/programs");
  revalidatePath("/app/student");
  revalidatePath("/app/parent");
  revalidatePath("/app/teacher");
  revalidatePath("/app/onboarding");
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function upsertProgramAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = programSchema.safeParse({
    programId: formData.get("programId") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    priceCents: formData.get("priceCents"),
    shopifyProductId: formData.get("shopifyProductId") || undefined,
    isActive: String(formData.get("isActive") ?? "true")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid program title, slug, description, price, and visibility." };
  }

  const supabase = createAdminClient();
  const payload = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description,
    price_cents: parsed.data.priceCents,
    shopify_product_id: parsed.data.shopifyProductId?.trim() || null,
    is_active: parsed.data.isActive === "true"
  };

  const query = parsed.data.programId
    ? supabase.from("programs").update(payload).eq("id", parsed.data.programId)
    : supabase.from("programs").insert(payload);

  const { error } = await query;
  if (error) {
    return { error: error.message };
  }

  revalidateAdminSurfaces();
  return { success: parsed.data.programId ? "Program updated." : "Program created." };
}

export async function grantEnrollmentAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = grantEnrollmentSchema.safeParse({
    programId: formData.get("programId"),
    userId: formData.get("userId"),
    accessReason: formData.get("accessReason")
  });

  if (!parsed.success) {
    return { error: "Please choose a program, target user, and access reason." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("enrollments").upsert(
    {
      user_id: parsed.data.userId,
      program_id: parsed.data.programId,
      status: "active",
      access_reason: parsed.data.accessReason,
      granted_by_admin_id: admin.user.id,
      revoked_at: null,
      revoked_by_admin_id: null
    },
    { onConflict: "user_id,program_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidateAdminSurfaces();
  return { success: "Enrollment granted." };
}

export async function revokeEnrollmentAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = revokeEnrollmentSchema.safeParse({
    enrollmentId: formData.get("enrollmentId"),
    revokeReason: formData.get("revokeReason")
  });

  if (!parsed.success) {
    return { error: "Please provide a revoke reason." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("enrollments")
    .update({
      status: "revoked",
      access_reason: parsed.data.revokeReason,
      revoked_at: new Date().toISOString(),
      revoked_by_admin_id: admin.user.id
    })
    .eq("id", parsed.data.enrollmentId);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminSurfaces();
  return { success: "Enrollment revoked." };
}

export async function assignPendingAccessAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = resolvePendingSchema.safeParse({
    pendingId: formData.get("pendingId"),
    targetUserId: formData.get("targetUserId"),
    resolutionNote: formData.get("resolutionNote")
  });

  if (!parsed.success) {
    return { error: "Please choose a target user and resolution note." };
  }

  const supabase = createAdminClient();
  const { data: pending, error: pendingError } = await supabase
    .from("pending_program_access")
    .select("id, email, program_id, purchase_id, status")
    .eq("id", parsed.data.pendingId)
    .single();

  if (pendingError || !pending) {
    return { error: pendingError?.message ?? "Pending access row not found." };
  }

  const { error: enrollmentError } = await supabase.from("enrollments").upsert(
    {
      user_id: parsed.data.targetUserId,
      program_id: pending.program_id,
      source_purchase_id: pending.purchase_id,
      status: "active",
      access_reason: `Resolved from pending access: ${parsed.data.resolutionNote}`,
      granted_by_admin_id: admin.user.id,
      revoked_at: null,
      revoked_by_admin_id: null
    },
    { onConflict: "user_id,program_id" }
  );

  if (enrollmentError) {
    return { error: enrollmentError.message };
  }

  const { error: pendingUpdateError } = await supabase
    .from("pending_program_access")
    .update({
      status: "assigned_manually",
      claimed_by_user_id: parsed.data.targetUserId,
      claimed_at: new Date().toISOString(),
      resolved_by_admin_id: admin.user.id,
      resolution_note: parsed.data.resolutionNote
    })
    .eq("id", pending.id);

  if (pendingUpdateError) {
    return { error: pendingUpdateError.message };
  }

  if (pending.purchase_id) {
    await supabase
      .from("purchases")
      .update({
        user_id: parsed.data.targetUserId,
        processing_state: "resolved_manually",
        processing_error: `Assigned by admin: ${parsed.data.resolutionNote}`
      })
      .eq("id", pending.purchase_id);
  }

  revalidateAdminSurfaces();
  return { success: "Pending access assigned to the selected user." };
}

export async function retryPurchaseProcessingAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = retryPurchaseSchema.safeParse({
    purchaseId: formData.get("purchaseId")
  });

  if (!parsed.success) {
    return { error: "Purchase id is required." };
  }

  const supabase = createAdminClient();
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .select("id, raw_payload")
    .eq("id", parsed.data.purchaseId)
    .single();

  if (purchaseError || !purchase?.raw_payload) {
    return { error: purchaseError?.message ?? "No raw payload was stored for that purchase." };
  }

  const result = await processShopifyOrderWebhook(purchase.raw_payload as any);
  revalidateAdminSurfaces();

  if (!result.ok) {
    return { error: typeof result.body.error === "string" ? result.body.error : "Retry failed." };
  }

  return { success: `Purchase retry completed with state: ${String((result.body as any).processingState ?? "processed")}.` };
}

export async function updateNotificationSettingAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = notificationSettingSchema.safeParse({
    type: formData.get("type"),
    isEnabled: String(formData.get("isEnabled") ?? "false"),
    inAppEnabled: String(formData.get("inAppEnabled") ?? "false"),
    emailEnabled: String(formData.get("emailEnabled") ?? "false")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid reminder type and configuration." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notification_settings")
    .update({
      is_enabled: parsed.data.isEnabled === "true",
      in_app_enabled: parsed.data.inAppEnabled === "true",
      email_enabled: parsed.data.emailEnabled === "true",
      updated_by_admin_id: admin.user.id,
      updated_at: new Date().toISOString()
    })
    .eq("type", parsed.data.type);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminSurfaces();
  return { success: "Reminder setting updated." };
}

export async function runNotificationSyncAction(_: AdminActionState, _formData: FormData): Promise<AdminActionState> {
  try {
    const admin = await requireAdmin();
    const result = await syncNotificationsForAllUsers({
      triggerSource: "manual_admin",
      triggeredByAdminId: admin.user.id
    });
    revalidateAdminSurfaces();
    return {
      success: `Reminder sync processed ${result.usersProcessed} user account(s), created ${result.notificationsCreated} notification record(s), and sent ${result.emailsSent} email(s).`
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function retryNotificationDeliveryAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = retryNotificationSchema.safeParse({
    notificationId: formData.get("notificationId")
  });

  if (!parsed.success) {
    return { error: "Notification id is required." };
  }

  try {
    await retryNotificationDelivery(parsed.data.notificationId);
    revalidateAdminSurfaces();
    return { success: "Notification delivery retried." };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function upsertProgramModuleAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = programModuleSchema.safeParse({
    moduleId: formData.get("moduleId") || undefined,
    programId: formData.get("programId"),
    title: formData.get("title"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid program, module title, description, and sort order." };
  }

  const supabase = createAdminClient();
  const payload = {
    program_id: parsed.data.programId,
    title: parsed.data.title,
    description: parsed.data.description,
    sort_order: parsed.data.sortOrder
  };

  const query = parsed.data.moduleId
    ? supabase.from("program_modules").update(payload).eq("id", parsed.data.moduleId)
    : supabase.from("program_modules").insert(payload);

  const { error } = await query;
  if (error) {
    return { error: error.message };
  }

  revalidateAdminSurfaces();
  return { success: parsed.data.moduleId ? "Module updated." : "Module created." };
}

export async function upsertProgramLessonAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = programLessonSchema.safeParse({
    lessonId: formData.get("lessonId") || undefined,
    programId: formData.get("programId"),
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    content: formData.get("content"),
    sortOrder: formData.get("sortOrder"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    isPublished: String(formData.get("isPublished") ?? "true")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid lesson title, summary, content, order, and publish state." };
  }

  const supabase = createAdminClient();
  const payload = {
    program_id: parsed.data.programId,
    module_id: parsed.data.moduleId,
    title: parsed.data.title,
    summary: parsed.data.summary,
    content: parsed.data.content,
    sort_order: parsed.data.sortOrder,
    estimated_minutes: parsed.data.estimatedMinutes,
    is_published: parsed.data.isPublished === "true"
  };

  const query = parsed.data.lessonId
    ? supabase.from("program_lessons").update(payload).eq("id", parsed.data.lessonId)
    : supabase.from("program_lessons").insert(payload);

  const { error } = await query;
  if (error) {
    return { error: error.message };
  }

  revalidateAdminSurfaces();
  return { success: parsed.data.lessonId ? "Lesson updated." : "Lesson created." };
}

export async function upsertLessonTaskAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = lessonTaskSchema.safeParse({
    taskId: formData.get("taskId") || undefined,
    lessonId: formData.get("lessonId"),
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    taskType: formData.get("taskType"),
    sortOrder: formData.get("sortOrder"),
    dueDate: formData.get("dueDate") || undefined,
    isRequired: String(formData.get("isRequired") ?? "true")
  });

  if (!parsed.success) {
    return { error: "Please provide a valid lesson task title, instructions, type, and order." };
  }

  const supabase = createAdminClient();
  const payload = {
    lesson_id: parsed.data.lessonId,
    title: parsed.data.title,
    instructions: parsed.data.instructions,
    task_type: parsed.data.taskType,
    sort_order: parsed.data.sortOrder,
    due_date: parsed.data.dueDate || null,
    is_required: parsed.data.isRequired === "true"
  };

  const query = parsed.data.taskId
    ? supabase.from("lesson_tasks").update(payload).eq("id", parsed.data.taskId)
    : supabase.from("lesson_tasks").insert(payload);

  const { error } = await query;
  if (error) {
    return { error: error.message };
  }

  revalidateAdminSurfaces();
  return { success: parsed.data.taskId ? "Lesson task updated." : "Lesson task created." };
}

export async function upsertProgramResourceAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const parsed = programResourceSchema.safeParse({
    resourceId: formData.get("resourceId") || undefined,
    programId: formData.get("programId"),
    moduleId: formData.get("moduleId") || undefined,
    lessonId: formData.get("lessonId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    resourceType: formData.get("resourceType"),
    externalUrl: formData.get("externalUrl") || undefined,
    isPublished: String(formData.get("isPublished") ?? "true"),
    existingBucket: formData.get("existingBucket") || undefined,
    existingStoragePath: formData.get("existingStoragePath") || undefined,
    existingFileName: formData.get("existingFileName") || undefined
  });

  if (!parsed.success) {
    return { error: "Please provide a valid resource title, type, and publish state." };
  }

  if (parsed.data.resourceType === "link") {
    const externalUrl = parsed.data.externalUrl?.trim();
    if (!externalUrl) {
      return { error: "A link resource needs a valid external URL." };
    }
  }

  const upload = formData.get("file");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  const bucket = getProgramResourcesBucket();
  let storagePath = parsed.data.existingStoragePath?.trim() || null;
  let fileName = parsed.data.existingFileName?.trim() || null;
  let resourceBucket = parsed.data.existingBucket?.trim() || null;

  if (parsed.data.resourceType === "file") {
    if (file) {
      const supabase = createAdminClient();
      const safeName = sanitizeFileName(file.name);
      const filePath = `${parsed.data.programId}/resources/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

      if (uploadError) {
        return { error: uploadError.message };
      }

      storagePath = filePath;
      fileName = file.name;
      resourceBucket = bucket;
    } else if (!storagePath || !resourceBucket) {
      return { error: "A file resource needs an uploaded file." };
    }
  } else {
    storagePath = null;
    fileName = null;
    resourceBucket = null;
  }

  const supabase = createAdminClient();
  const payload = {
    program_id: parsed.data.programId,
    module_id: parsed.data.moduleId || null,
    lesson_id: parsed.data.lessonId || null,
    title: parsed.data.title,
    description: parsed.data.description,
    resource_type: parsed.data.resourceType,
    external_url: parsed.data.resourceType === "link" ? parsed.data.externalUrl?.trim() || null : null,
    bucket: parsed.data.resourceType === "file" ? resourceBucket : null,
    storage_path: parsed.data.resourceType === "file" ? storagePath : null,
    file_name: parsed.data.resourceType === "file" ? fileName : null,
    is_published: parsed.data.isPublished === "true"
  };

  const query = parsed.data.resourceId
    ? supabase.from("program_resources").update(payload).eq("id", parsed.data.resourceId)
    : supabase.from("program_resources").insert(payload);

  const { error } = await query;
  if (error) {
    return { error: error.message };
  }

  revalidateAdminSurfaces();
  return { success: parsed.data.resourceId ? "Resource updated." : "Resource created." };
}
