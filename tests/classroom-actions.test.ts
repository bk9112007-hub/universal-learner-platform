import { beforeEach, describe, expect, it, vi } from "vitest";

function mockTeacherProfile() {
  vi.doMock("@/lib/dashboard/queries", () => ({
    getProfileForCurrentUser: vi.fn(async () => ({
      user: { id: "teacher-1" },
      profile: { role: "teacher" }
    }))
  }));
}

describe("classroom assignment action", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns a clear error when the selected student profile is incomplete", async () => {
    mockTeacherProfile();
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: null, error: null }))
                }))
              }))
            };
          }

          throw new Error(`Unexpected table ${table}`);
        })
      })
    }));

    const { assignLearnerAction } = await import("@/lib/classroom/actions");
    const formData = new FormData();
    formData.set("studentId", "6e7b9ea4-9af4-4d0c-a2b1-c50098528faa");

    await expect(assignLearnerAction({}, formData)).resolves.toEqual({
      error: "That learner account is incomplete right now. Repair the student profile before assigning them."
    });
  });

  it("returns a clear error when the learner is already assigned with the same cohort", async () => {
    mockTeacherProfile();
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: {
                      id: "student-1",
                      role: "student",
                      role_source: "explicit"
                    },
                    error: null
                  }))
                }))
              }))
            };
          }

          if (table === "teacher_student_assignments") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({
                      data: { id: "assignment-1", cohort_id: null },
                      error: null
                    }))
                  }))
                }))
              }))
            };
          }

          throw new Error(`Unexpected table ${table}`);
        })
      })
    }));

    const { assignLearnerAction } = await import("@/lib/classroom/actions");
    const formData = new FormData();
    formData.set("studentId", "6e7b9ea4-9af4-4d0c-a2b1-c50098528faa");

    await expect(assignLearnerAction({}, formData)).resolves.toEqual({
      error: "This learner is already assigned with that cohort selection."
    });
  });
});
