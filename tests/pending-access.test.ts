import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery, createSupabaseMock } from "@/tests/helpers/supabase";

describe("pending access claim", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("claims pending rows and returns claimed program slugs", async () => {
    const pendingRows = [
      {
        id: "pending-1",
        program_id: "program-1",
        purchase_id: "purchase-1",
        status: "pending",
        programs: { slug: "the-scholar-program" }
      }
    ];

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () =>
        createSupabaseMock({
          pending_program_access: createQuery({
            awaitResult: { data: pendingRows, error: null }
          }),
          enrollments: createQuery({ awaitResult: { data: null, error: null } }),
          purchases: createQuery({ awaitResult: { data: null, error: null } })
        })
    }));

    const { claimPendingProgramAccessForEmail } = await import("@/lib/programs/access");
    const result = await claimPendingProgramAccessForEmail({
      email: "student@example.com",
      userId: "student-1"
    });

    expect(result.claimedCount).toBe(1);
    expect(result.claimedProgramSlugs).toEqual(["the-scholar-program"]);
  });
});
