"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function claimPendingProgramAccessForEmail({
  email,
  userId
}: {
  email: string;
  userId: string;
}) {
  const supabase = createAdminClient();

  const { data: pendingRows, error: pendingError } = await supabase
    .from("pending_program_access")
    .select("id, program_id, purchase_id, status, programs ( slug )")
    .eq("email", email.toLowerCase())
    .eq("status", "pending");

  if (pendingError) {
    throw new Error(pendingError.message);
  }

  if (!pendingRows || pendingRows.length === 0) {
    return { claimedCount: 0, claimedProgramSlugs: [] as string[] };
  }

  const { error: enrollmentError } = await supabase.from("enrollments").upsert(
    pendingRows.map((row: any) => ({
      user_id: userId,
      program_id: row.program_id,
      source_purchase_id: row.purchase_id,
      status: "active",
      access_reason: "Automatically claimed from pending purchase access"
    })),
    { onConflict: "user_id,program_id" }
  );

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const { error: updatePendingError } = await supabase
    .from("pending_program_access")
    .update({
      status: "claimed",
      claimed_by_user_id: userId,
      claimed_at: new Date().toISOString()
    })
    .eq("email", email.toLowerCase())
    .eq("status", "pending");

  if (updatePendingError) {
    throw new Error(updatePendingError.message);
  }

  const { error: purchaseLinkError } = await supabase
    .from("purchases")
    .update({
      user_id: userId,
      processing_state: "enrolled",
      processing_error: null
    })
    .eq("email", email.toLowerCase())
    .in("processing_state", ["pending_account", "received"]);

  if (purchaseLinkError) {
    throw new Error(purchaseLinkError.message);
  }

  return {
    claimedCount: pendingRows.length,
    claimedProgramSlugs: pendingRows
      .map((row: any) => (Array.isArray(row.programs) ? row.programs[0]?.slug : row.programs?.slug))
      .filter(Boolean)
  };
}

export async function requireProgramAccess(slug: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, program: null };
  }

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("id, title, slug, description, price_cents, shopify_product_id, is_active")
    .eq("slug", slug)
    .single();

  if (programError || !program) {
    return { allowed: false, program: null };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "admin") {
    return { allowed: true, program };
  }

  const [{ data: ownEnrollment }, { data: linkedEnrollment }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .eq("status", "active")
      .maybeSingle(),
    profile?.role === "parent"
      ? supabase
          .from("enrollments")
          .select("id, user_id")
          .eq("program_id", program.id)
          .eq("status", "active")
      : Promise.resolve({ data: [] as any[] })
  ]);

  if (ownEnrollment) {
    return { allowed: true, program };
  }

  if (profile?.role === "parent" && Array.isArray(linkedEnrollment) && linkedEnrollment.length > 0) {
    const linkedIds = linkedEnrollment.map((item: any) => item.user_id);
    const { data: links } = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_id", user.id)
      .in("student_id", linkedIds);

    if ((links ?? []).length > 0) {
      return { allowed: true, program };
    }
  }

  return { allowed: false, program };
}
