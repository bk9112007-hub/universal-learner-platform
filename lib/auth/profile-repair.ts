import "server-only";

import type { User } from "@supabase/supabase-js";

import { getPostAuthDestination } from "@/lib/auth/post-auth";
import { getRoleRoute } from "@/lib/auth/roles";
import { claimPendingProgramAccessForEmail } from "@/lib/programs/access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/domain";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  role_source: "explicit" | "fallback";
};

type ProfileRepairPlan = {
  resolvedRole: UserRole;
  roleSource: "explicit" | "fallback";
  email: string | null;
  fullName: string | null;
  needsRoleCompletion: boolean;
  shouldBackfillMetadata: boolean;
};

type EnsureProfileOptions = {
  preferredRole?: UserRole | null;
};

type EnsureProfileResult = {
  profile: ProfileRow;
  needsRoleCompletion: boolean;
};

type PostAuthResolution = {
  destination: string;
};

function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "student" || normalized === "teacher" || normalized === "parent" || normalized === "admin") {
    return normalized;
  }

  return null;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function normalizeFullName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function extractFullName(user: Pick<User, "user_metadata">) {
  const metadata = user.user_metadata ?? {};

  return (
    normalizeFullName(metadata.full_name) ??
    normalizeFullName(metadata.fullName) ??
    normalizeFullName(metadata.name) ??
    normalizeFullName([metadata.first_name, metadata.last_name].filter((value) => typeof value === "string" && value.trim().length > 0).join(" "))
  );
}

export function buildProfileRepairPlan(
  user: Pick<User, "email" | "user_metadata">,
  existingProfile: ProfileRow | null,
  preferredRole?: UserRole | null
): ProfileRepairPlan {
  const metadataRole = normalizeRole(user.user_metadata?.role);
  const explicitRole = preferredRole ?? metadataRole ?? (existingProfile?.role_source === "explicit" ? existingProfile.role : null);
  const resolvedRole = explicitRole ?? existingProfile?.role ?? "student";
  const roleSource = explicitRole ? "explicit" : "fallback";

  return {
    resolvedRole,
    roleSource,
    email: normalizeEmail(user.email) ?? existingProfile?.email ?? null,
    fullName: extractFullName(user) ?? existingProfile?.full_name ?? null,
    needsRoleCompletion: !explicitRole,
    shouldBackfillMetadata: !metadataRole && roleSource === "explicit"
  };
}

export async function ensureProfileForUser(user: User, options: EnsureProfileOptions = {}): Promise<EnsureProfileResult> {
  const supabase = createAdminClient();
  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, role_source")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const plan = buildProfileRepairPlan(user, (existingProfile as ProfileRow | null) ?? null, options.preferredRole ?? null);
  const profilePayload = {
    id: user.id,
    email: plan.email,
    full_name: plan.fullName,
    role: plan.resolvedRole,
    role_source: plan.roleSource
  };

  const { error: upsertError } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const metadataPatch: Record<string, unknown> = {};
  if (plan.shouldBackfillMetadata || options.preferredRole) {
    metadataPatch.role = plan.resolvedRole;
  }
  if (plan.fullName && !normalizeFullName(user.user_metadata?.full_name)) {
    metadataPatch.full_name = plan.fullName;
  }

  if (Object.keys(metadataPatch).length > 0) {
    const { error: metadataError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        ...metadataPatch
      }
    });

    if (metadataError) {
      throw new Error(metadataError.message);
    }
  }

  return {
    profile: profilePayload,
    needsRoleCompletion: plan.needsRoleCompletion
  };
}

export async function resolvePostAuthDestination(user: User, options: EnsureProfileOptions = {}): Promise<PostAuthResolution> {
  const repair = await ensureProfileForUser(user, options);

  if (repair.needsRoleCompletion) {
    return { destination: "/complete-role" };
  }

  const claimed = user.email
    ? await claimPendingProgramAccessForEmail({
        email: user.email,
        userId: user.id
      })
    : { claimedProgramSlugs: [] as string[] };

  const destination = await getPostAuthDestination({
    userId: user.id,
    role: repair.profile.role,
    claimedProgramSlugs: claimed.claimedProgramSlugs
  });

  return {
    destination: destination || getRoleRoute(repair.profile.role)
  };
}
