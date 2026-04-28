import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery, createSupabaseMock } from "@/tests/helpers/supabase";

describe("personalized project actions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("generates an individual personalized project brief for an assigned learner", async () => {
    vi.doMock("@/lib/dashboard/queries", () => ({
      getProfileForCurrentUser: vi.fn(async () => ({
        user: { id: "teacher-1" },
        profile: { role: "teacher" }
      })),
      getTeacherAssignedLearners: vi.fn(async () => []),
      getTeacherCohorts: vi.fn(async () => [])
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        auth: {
          admin: {
            listUsers: vi.fn()
          }
        },
        from: vi.fn((table: string) => {
          if (table === "teacher_student_assignments") {
            return createQuery({
              maybeSingleResult: {
                data: { student_id: "student-1" },
                error: null
              }
            });
          }
          if (table === "profiles") {
            return createQuery({
              awaitResult: {
                data: [{ id: "student-1", full_name: "Jordan Miles" }],
                error: null
              }
            });
          }
          if (table === "student_interest_assessments") {
            return createQuery({
              awaitResult: {
                data: [
                  {
                    student_id: "student-1",
                    career_preference: "Engineering",
                    entertainment_preference: "Gaming",
                    work_style: "Hands-on building",
                    industry_interest: "Technology"
                  }
                ],
                error: null
              }
            });
          }
          if (table === "student_skill_diagnostics") {
            return createQuery({
              awaitResult: {
                data: [
                  {
                    student_id: "student-1",
                    reading_level: "at",
                    writing_level: "below",
                    math_level: "above",
                    history_level: "at",
                    logic_level: "advanced",
                    strengths: ["Logic"],
                    weaknesses: ["Writing"]
                  }
                ],
                error: null
              }
            });
          }
          if (table === "personalized_project_briefs") {
            return createQuery({
              singleResult: {
                data: { id: "brief-1" },
                error: null
              }
            });
          }
          if (table === "personalized_project_brief_students") {
            return createQuery({
              awaitResult: {
                data: null,
                error: null
              }
            });
          }

          throw new Error(`Unexpected table ${table}`);
        })
      })
    }));

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => createSupabaseMock({})
    }));

    const { generatePersonalizedProjectAction } = await import("@/lib/projects/personalization");
    const formData = new FormData();
    formData.set("targetMode", "student");
    formData.set("studentId", "11111111-1111-4111-8111-111111111111");
    formData.set("teacherPriorities", "Strengthen explanatory writing and real-world math in a technology project.");
    formData.set("focusStrengths", "Logic");
    formData.set("focusWeaknesses", "Writing");

    const result = await generatePersonalizedProjectAction({}, formData);
    expect(result).toEqual({ success: "Personalized project brief generated." });
  });
});
