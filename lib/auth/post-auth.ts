"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/domain";

export async function getPostAuthDestination({
  userId,
  role,
  claimedProgramSlugs
}: {
  userId: string;
  role: UserRole;
  claimedProgramSlugs: string[];
}) {
  if (claimedProgramSlugs.length > 0) {
    const params = new URLSearchParams({
      claimed: "1",
      count: String(claimedProgramSlugs.length)
    });

    if (claimedProgramSlugs.length === 1) {
      params.set("program", claimedProgramSlugs[0]);
    }

    return `/app/onboarding?${params.toString()}`;
  }

  const supabase = createAdminClient();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("programs ( slug )")
    .eq("user_id", userId)
    .eq("status", "active");

  const directProgramSlugs = (enrollments ?? [])
    .map((row: any) => (Array.isArray(row.programs) ? row.programs[0]?.slug : row.programs?.slug))
    .filter(Boolean);

  if (role === "student" && directProgramSlugs.length === 1) {
    return `/app/programs/${directProgramSlugs[0]}`;
  }

  if ((role === "student" || role === "parent") && directProgramSlugs.length > 0) {
    return "/app/onboarding";
  }

  return role === "student"
    ? "/app/student"
    : role === "teacher"
      ? "/app/teacher"
      : role === "parent"
        ? "/app/parent"
        : "/app/admin";
}
