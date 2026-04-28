import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery } from "@/tests/helpers/supabase";

function mockStaffProfile(role: "teacher" | "admin" = "teacher") {
  vi.doMock("@/lib/dashboard/queries", () => ({
    getProfileForCurrentUser: vi.fn(async () => ({
      user: { id: "staff-1" },
      profile: { role }
    }))
  }));
}

describe("project catalog admin actions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates a hook entry through the shared catalog action", async () => {
    mockStaffProfile("teacher");

    const insertQuery = createQuery({
      awaitResult: {
        data: null,
        error: null
      }
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: vi.fn((table: string) => {
          if (table !== "project_hooks") {
            throw new Error(`Unexpected table ${table}`);
          }
          return insertQuery;
        })
      })
    }));

    const { upsertProjectCatalogItemAction } = await import("@/lib/admin/actions");
    const formData = new FormData();
    formData.set("catalogType", "hooks");
    formData.set("title", "Neighborhood Innovation Challenge");
    formData.set("summary", "Learners begin with a real local problem and investigate how to improve daily life.");
    formData.set("details", "Students identify a visible neighborhood challenge, gather observations and short interviews, compare existing responses, and explain why their final idea is realistic, ethical, and worth trying.");
    formData.set("status", "approved");

    await expect(upsertProjectCatalogItemAction({}, formData)).resolves.toEqual({
      success: "hook created."
    });

    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Neighborhood Innovation Challenge",
        status: "approved",
        created_by: "staff-1",
        updated_by: "staff-1"
      })
    );
  });

  it("archives an existing catalog item through the shared archive action", async () => {
    mockStaffProfile("admin");

    const updateQuery = createQuery({
      awaitResult: {
        data: null,
        error: null
      }
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: vi.fn((table: string) => {
          if (table !== "project_outputs") {
            throw new Error(`Unexpected table ${table}`);
          }
          return updateQuery;
        })
      })
    }));

    const { archiveProjectCatalogItemAction } = await import("@/lib/admin/actions");
    const formData = new FormData();
    formData.set("catalogType", "outputs");
    formData.set("itemId", "11111111-1111-4111-8111-111111111111");

    await expect(archiveProjectCatalogItemAction({}, formData)).resolves.toEqual({
      success: "output archived."
    });

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "archived",
        updated_by: "staff-1"
      })
    );
    expect(updateQuery.eq).toHaveBeenCalledWith("id", "11111111-1111-4111-8111-111111111111");
  });
});
