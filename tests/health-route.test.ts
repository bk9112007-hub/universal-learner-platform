import { beforeEach, describe, expect, it, vi } from "vitest";

describe("health endpoint", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 503 when required runtime env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.ok).toBe(false);
    expect(json.missingRequired.length).toBeGreaterThan(0);
  });

  it("returns 200 when required runtime env vars are present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.features.coreAppReady).toBe(true);
  });
});
