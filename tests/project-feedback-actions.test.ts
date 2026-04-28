import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery, createSupabaseMock } from "@/tests/helpers/supabase";

describe("student submission and teacher feedback actions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates a student project submission", async () => {
    const supabase = createSupabaseMock({
      projects: createQuery({
        singleResult: { data: { id: "project-1" }, error: null }
      }),
      submissions: createQuery({
        singleResult: { data: { id: "submission-1" }, error: null }
      }),
      files: createQuery({ awaitResult: { data: null, error: null } })
    });

    vi.doMock("@/lib/dashboard/queries", () => ({
      getProfileForCurrentUser: vi.fn(async () => ({
        user: { id: "student-1" },
        profile: { role: "student" }
      }))
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => supabase
    }));

    const { createProjectSubmissionAction } = await import("@/lib/projects/actions");
    const formData = new FormData();
    formData.set("title", "Community Garden");
    formData.set("subject", "Science");
    formData.set("description", "A project about the school garden and water usage.");
    formData.set("submissionText", "This is the student submission text for review.");

    const result = await createProjectSubmissionAction({}, formData);
    expect(result.success).toContain("Project submitted successfully");
  });

  it("creates teacher feedback and updates project state", async () => {
    const supabase = createSupabaseMock({
      feedback: createQuery({ awaitResult: { data: null, error: null } }),
      projects: createQuery({
        awaitResult: { data: null, error: null },
        singleResult: {
          data: { program_id: "program-1", lesson_id: "lesson-1", lesson_task_id: "task-1" },
          error: null
        }
      }),
      submissions: createQuery({ awaitResult: { data: null, error: null } })
    });

    vi.doMock("@/lib/dashboard/queries", () => ({
      getProfileForCurrentUser: vi.fn(async () => ({
        user: { id: "teacher-1" },
        profile: { role: "teacher", full_name: "Teacher" }
      }))
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => supabase
    }));
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () =>
        createSupabaseMock({
          lesson_task_progress: createQuery({ awaitResult: { data: null, error: null } }),
          project_task_progress: createQuery({ maybeSingleResult: { data: null, error: null }, awaitResult: { data: null, error: null } })
        })
    }));
    vi.doMock("@/lib/programs/progress", () => ({
      syncLessonProgressForUser: vi.fn(async () => undefined)
    }));

    const { createTeacherFeedbackAction } = await import("@/lib/projects/actions");
    const formData = new FormData();
    formData.set("submissionId", "11111111-1111-4111-8111-111111111111");
    formData.set("projectId", "22222222-2222-4222-8222-222222222222");
    formData.set("studentId", "33333333-3333-4333-8333-333333333333");
    formData.set("score", "8.5");
    formData.set("comment", "Strong work with a clear revision path.");

    const result = await createTeacherFeedbackAction({}, formData);
    expect(result).toEqual({ success: "Feedback sent to the student dashboard." });
  });
});
