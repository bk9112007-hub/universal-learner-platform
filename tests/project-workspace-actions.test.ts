import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery, createSupabaseMock } from "@/tests/helpers/supabase";

describe("project workspace actions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates and redirects into a project workspace from a personalized brief", async () => {
    let projectsCall = 0;
    const supabase = createSupabaseMock({
      projects: () => {
        projectsCall += 1;
        if (projectsCall === 1) {
          return createQuery({ maybeSingleResult: { data: null, error: null } });
        }

        return createQuery({ singleResult: { data: { id: "project-1" }, error: null } });
      },
      personalized_project_brief_students: createQuery({
        maybeSingleResult: {
          data: {
            brief_id: "brief-1",
            personalized_project_briefs: {
              title: "Community Impact Studio",
              subject: "Interdisciplinary",
              description: "Investigate and present a local challenge."
            }
          },
          error: null
        }
      })
    });

    const redirectMock = vi.fn((href: string) => {
      throw new Error(`REDIRECT:${href}`);
    });
    const seedMock = vi.fn(async () => undefined);

    vi.doMock("@/lib/dashboard/queries", () => ({
      getProfileForCurrentUser: vi.fn(async () => ({
        user: { id: "student-1" },
        profile: { role: "student" }
      }))
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => supabase
    }));
    vi.doMock("@/lib/projects/workspace", () => ({
      ensureProjectWorkspaceSeedFromBrief: seedMock,
      getProjectWorkspaceAccessContext: vi.fn()
    }));
    vi.doMock("next/navigation", () => ({
      redirect: redirectMock
    }));

    const { launchProjectWorkspaceAction } = await import("@/lib/projects/workspace-actions");
    const formData = new FormData();
    formData.set("briefId", "11111111-1111-4111-8111-111111111111");

    await expect(launchProjectWorkspaceAction({}, formData)).rejects.toThrow("REDIRECT:/app/projects/project-1");
    expect(seedMock).toHaveBeenCalledWith("project-1", "11111111-1111-4111-8111-111111111111", "student-1");
  });
});
