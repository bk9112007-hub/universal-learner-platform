import { describe, expect, it } from "vitest";

import { buildProfileRepairPlan } from "@/lib/auth/profile-repair";

describe("profile repair planning", () => {
  it("keeps explicit signup roles and avoids role completion", () => {
    const plan = buildProfileRepairPlan(
      {
        email: "student@example.com",
        user_metadata: {
          full_name: "Student Example",
          role: "student"
        }
      } as any,
      null
    );

    expect(plan.resolvedRole).toBe("student");
    expect(plan.roleSource).toBe("explicit");
    expect(plan.needsRoleCompletion).toBe(false);
  });

  it("requires role completion when a user has no profile and no role metadata", () => {
    const plan = buildProfileRepairPlan(
      {
        email: "unknown@example.com",
        user_metadata: {
          full_name: "Unknown User"
        }
      } as any,
      null
    );

    expect(plan.resolvedRole).toBe("student");
    expect(plan.roleSource).toBe("fallback");
    expect(plan.needsRoleCompletion).toBe(true);
  });

  it("backfills missing auth metadata from an explicit existing profile", () => {
    const plan = buildProfileRepairPlan(
      {
        email: "teacher@example.com",
        user_metadata: {}
      } as any,
      {
        id: "teacher-1",
        email: "teacher@example.com",
        full_name: "Teacher Example",
        role: "teacher",
        role_source: "explicit"
      }
    );

    expect(plan.resolvedRole).toBe("teacher");
    expect(plan.roleSource).toBe("explicit");
    expect(plan.needsRoleCompletion).toBe(false);
    expect(plan.shouldBackfillMetadata).toBe(true);
  });
});
