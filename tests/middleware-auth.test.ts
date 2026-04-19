import { beforeEach, describe, expect, it, vi } from "vitest";

describe("middleware auth protection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("redirects unauthenticated app requests to login", async () => {
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: null } })
        }
      })
    }));

    const { updateSession } = await import("@/lib/supabase/middleware");
    const nextUrl = new URL("http://localhost:3000/app/student");
    const request = {
      nextUrl: Object.assign(nextUrl, {
        clone: () => new URL(nextUrl.toString())
      }),
      cookies: {
        getAll: () => [],
        set: vi.fn()
      }
    } as any;

    const response = await updateSession(request);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?redirectedFrom=%2Fapp%2Fstudent");
  });
});
