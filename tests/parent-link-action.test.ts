import { beforeEach, describe, expect, it, vi } from "vitest";

function mockParentProfile() {
  vi.doMock("@/lib/dashboard/queries", () => ({
    getProfileForCurrentUser: vi.fn(async () => ({
      user: { id: "parent-1" },
      profile: { role: "parent" }
    }))
  }));
}

function mockRevalidatePath() {
  vi.doMock("next/cache", async (importOriginal) => {
    const actual = await importOriginal<typeof import("next/cache")>();
    return {
      ...actual,
      revalidatePath: vi.fn()
    };
  });
}

function mockRpcStatus(status: "linked" | "not_found" | "not_student" | "forbidden") {
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: async () => ({
      rpc: vi.fn(async () => ({
        data: [{ status, linked_student_id: status === "linked" || status === "not_student" ? "student-1" : null }],
        error: null
      }))
    })
  }));
}

describe("parent child link action", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns success when the rpc reports a linked student", async () => {
    mockParentProfile();
    mockRevalidatePath();
    mockRpcStatus("linked");

    const { linkChildToParentAction } = await import("@/lib/parents/actions");
    const formData = new FormData();
    formData.set("childEmail", "student@example.com");

    await expect(linkChildToParentAction({}, formData)).resolves.toEqual({
      success: "Child linked successfully."
    });
  });

  it("returns the correct error when the rpc reports not_found", async () => {
    mockParentProfile();
    mockRpcStatus("not_found");

    const { linkChildToParentAction } = await import("@/lib/parents/actions");
    const formData = new FormData();
    formData.set("childEmail", "missing-student@example.com");

    await expect(linkChildToParentAction({}, formData)).resolves.toEqual({
      error: "No student account was found for that email address."
    });
  });

  it("returns the correct error when the rpc reports not_student", async () => {
    mockParentProfile();
    mockRpcStatus("not_student");

    const { linkChildToParentAction } = await import("@/lib/parents/actions");
    const formData = new FormData();
    formData.set("childEmail", "teacher@example.com");

    await expect(linkChildToParentAction({}, formData)).resolves.toEqual({
      error: "That account is not a student profile."
    });
  });

  it("returns the correct error when the rpc reports forbidden", async () => {
    mockParentProfile();
    mockRpcStatus("forbidden");

    const { linkChildToParentAction } = await import("@/lib/parents/actions");
    const formData = new FormData();
    formData.set("childEmail", "student@example.com");

    await expect(linkChildToParentAction({}, formData)).resolves.toEqual({
      error: "You are not allowed to link a child account right now."
    });
  });
});
