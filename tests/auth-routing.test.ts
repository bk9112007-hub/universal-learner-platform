import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery, createSupabaseMock } from "@/tests/helpers/supabase";

describe("auth and role routing", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("routes a student with one enrollment directly into the program", async () => {
    const enrollmentQuery = createQuery({
      awaitResult: {
        data: [{ programs: { slug: "grade-ace-tutoring" } }],
        error: null
      }
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => createSupabaseMock({ enrollments: enrollmentQuery })
    }));

    const { getPostAuthDestination } = await import("@/lib/auth/post-auth");
    await expect(
      getPostAuthDestination({
        userId: "student-1",
        role: "student",
        claimedProgramSlugs: []
      })
    ).resolves.toBe("/app/programs/grade-ace-tutoring");
  });

  it("sends claimed pending access through onboarding", async () => {
    const { getPostAuthDestination } = await import("@/lib/auth/post-auth");
    await expect(
      getPostAuthDestination({
        userId: "student-1",
        role: "student",
        claimedProgramSlugs: ["the-scholar-program"]
      })
    ).resolves.toContain("/app/onboarding?claimed=1");
  });

  it("redirects callback users to the resolved post-auth destination", async () => {
    const supabase = createSupabaseMock({});
    supabase.auth.getUser = vi.fn(async () => ({
      data: { user: { id: "student-1", email: "student@example.com" } }
    }));

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => supabase
    }));
    vi.doMock("@/lib/auth/profile-repair", () => ({
      resolvePostAuthDestination: vi.fn(async () => ({
        destination: "/app/programs/grade-ace-tutoring"
      }))
    }));

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=test-code") as any
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/app/programs/grade-ace-tutoring");
  });
});
