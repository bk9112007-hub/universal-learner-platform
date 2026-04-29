import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery } from "@/tests/helpers/supabase";

describe("project formulator actions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  function mockStaffProfile() {
    vi.doMock("@/lib/dashboard/queries", () => ({
      getProfileForCurrentUser: vi.fn(async () => ({
        user: { id: "teacher-1" },
        profile: { role: "teacher" }
      }))
    }));
  }

  it("creates a generated project draft and returns a redirect path", async () => {
    mockStaffProfile();

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: vi.fn((table: string) => {
          if (table === "project_hooks" || table === "project_roles" || table === "project_scenarios" || table === "project_activities" || table === "project_outputs") {
            return createQuery({
              maybeSingleResult: {
                data: {
                  id: `${table}-1`,
                  title: `Title for ${table}`,
                  summary: `Summary for ${table}`,
                  details: `Details for ${table}`,
                  status: "approved"
                },
                error: null
              }
            });
          }

          if (table === "generated_projects") {
            return createQuery({
              singleResult: {
                data: { id: "draft-1" },
                error: null
              }
            });
          }

          throw new Error(`Unexpected table ${table}`);
        })
      })
    }));

    const { createGeneratedProjectDraftAction } = await import("@/lib/project-formulator/actions");
    const formData = new FormData();
    formData.set("subject", "Science");
    formData.set("skillGoal", "Explanatory writing");
    formData.set("gradeBand", "Middle school");
    formData.set("difficulty", "Intermediate");
    formData.set("duration", "2 weeks");
    formData.set("studentInterests", "storms, cities");
    formData.set("hookId", "11111111-1111-4111-8111-111111111111");
    formData.set("roleId", "22222222-2222-4222-8222-222222222222");
    formData.set("scenarioId", "33333333-3333-4333-8333-333333333333");
    formData.set("activityId", "44444444-4444-4444-8444-444444444444");
    formData.set("outputId", "55555555-5555-4555-8555-555555555555");

    await expect(createGeneratedProjectDraftAction({}, formData)).resolves.toEqual({
      success: "Draft project created.",
      redirectTo: "/app/admin/project-formulator/draft-1"
    });
  });

  it("maps the assign later intent to assigned status", async () => {
    mockStaffProfile();

    const updateQuery = createQuery({
      awaitResult: {
        data: null,
        error: null
      }
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: vi.fn((table: string) => {
          if (table !== "generated_projects") {
            throw new Error(`Unexpected table ${table}`);
          }
          return updateQuery;
        })
      })
    }));

    const { updateGeneratedProjectDraftAction } = await import("@/lib/project-formulator/actions");
    const formData = new FormData();
    formData.set("draftProjectId", "11111111-1111-4111-8111-111111111111");
    formData.set("subject", "Science");
    formData.set("skillGoal", "Explanatory writing");
    formData.set("gradeBand", "Middle school");
    formData.set("difficulty", "Intermediate");
    formData.set("duration", "2 weeks");
    formData.set("studentInterests", "storms, cities");
    formData.set("title", "Future City Under Pressure: Crisis Response Planner");
    formData.set("summary", "A detailed summary that is long enough for validation.");
    formData.set("studentMission", "A detailed mission statement that is also long enough for validation.");
    formData.set("learningGoals", "Goal one\nGoal two\nGoal three");
    formData.set("steps", "Step one\nStep two\nStep three");
    formData.set("materials", "Material one\nMaterial two");
    formData.set("rubric", "Criterion one\nCriterion two");
    formData.set("reflectionQuestions", "Question one\nQuestion two");
    formData.set("intent", "assign_later");

    await expect(updateGeneratedProjectDraftAction({}, formData)).resolves.toEqual({
      success: "Draft marked for later assignment."
    });

    expect(updateQuery.update).toHaveBeenCalledWith(expect.objectContaining({ approval_status: "assigned" }));
  });

  it("assigns an approved generated project to a student and launches the real workspace", async () => {
    mockStaffProfile();

    const assignmentQuery = createQuery({
      awaitResult: {
        data: null,
        error: null
      }
    });
    const generatedProjectUpdateQuery = createQuery({
      awaitResult: {
        data: null,
        error: null
      }
    });

    vi.doMock("@/lib/project-formulator/queries", () => ({
      getGeneratedProjectById: vi.fn(async () => ({
        id: "draft-1",
        subject: "Science",
        skillGoal: "Explanatory writing",
        gradeBand: "Middle school",
        difficulty: "Intermediate",
        duration: "2 weeks",
        studentInterests: ["storms"],
        experienceType: "mission_dashboard",
        title: "Future City Under Pressure: Crisis Response Planner",
        summary: "Summary",
        studentMission: "Mission",
        learningGoals: ["Goal"],
        steps: ["Step 1"],
        materials: ["Material 1"],
        rubric: ["Criterion 1"],
        reflectionQuestions: ["Question 1"],
        approvalStatus: "approved",
        hookSnapshot: { id: "hook-1", title: "Hook", summary: "Summary", details: "Details", status: "approved" },
        roleSnapshot: { id: "role-1", title: "Role", summary: "Summary", details: "Details", status: "approved" },
        scenarioSnapshot: { id: "scenario-1", title: "Scenario", summary: "Summary", details: "Details", status: "approved" },
        activitySnapshot: { id: "activity-1", title: "Activity", summary: "Summary", details: "Details", status: "approved" },
        outputSnapshot: { id: "output-1", title: "Output", summary: "Summary", details: "Details", status: "approved" },
        createdAt: "",
        updatedAt: ""
      }))
    }));

    vi.doMock("@/lib/projects/workspace", () => ({
      createProjectWorkspaceFromGeneratedProject: vi.fn(async () => "project-1")
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: vi.fn((table: string) => {
          if (table === "generated_project_assignments") {
            return assignmentQuery;
          }
          if (table === "generated_projects") {
            return generatedProjectUpdateQuery;
          }
          throw new Error(`Unexpected table ${table}`);
        })
      })
    }));

    const { assignGeneratedProjectToStudentAction } = await import("@/lib/project-formulator/actions");
    const formData = new FormData();
    formData.set("draftProjectId", "11111111-1111-4111-8111-111111111111");
    formData.set("studentId", "22222222-2222-4222-8222-222222222222");

    await expect(assignGeneratedProjectToStudentAction({}, formData)).resolves.toEqual({
      success: "Generated project assigned and launched for the student workspace."
    });

    expect(assignmentQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: "project-1",
        status: "launched"
      }),
      { onConflict: "generated_project_id,student_id" }
    );
    expect(generatedProjectUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        approval_status: "assigned"
      })
    );
  });
});
