import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery, createSupabaseMock } from "@/tests/helpers/supabase";

describe("protected program access", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows direct active enrollment", async () => {
    const supabase = createSupabaseMock({
      programs: createQuery({
        singleResult: {
          data: { id: "program-1", slug: "grade-ace-tutoring", title: "Grade Ace" },
          error: null
        }
      }),
      profiles: createQuery({
        singleResult: { data: { role: "student" }, error: null }
      }),
      enrollments: (() => {
        let call = 0;
        return () =>
          createQuery({
            maybeSingleResult: call++ === 0 ? { data: { id: "enrollment-1" }, error: null } : { data: null, error: null },
            awaitResult: { data: [], error: null }
          });
      })()
    });
    supabase.auth.getUser = vi.fn(async () => ({ data: { user: { id: "student-1" } } }));

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => supabase
    }));

    const { requireProgramAccess } = await import("@/lib/programs/access");
    await expect(requireProgramAccess("grade-ace-tutoring")).resolves.toMatchObject({ allowed: true });
  });
});
