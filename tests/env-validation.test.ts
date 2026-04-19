import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

describe("environment validation", () => {
  const scriptPath = path.resolve(process.cwd(), "scripts/validate-env.mjs");

  it("fails clearly when required env vars are missing", () => {
    const result = spawnSync(process.execPath, [scriptPath, "production"], {
      env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", NEXT_PUBLIC_SITE_URL: "" }
    });

    expect(result.status).toBe(1);
    expect(result.stderr.toString() || result.stdout.toString()).toContain("Missing required environment variables");
  });

  it("passes when required env vars are present", () => {
    const result = spawnSync(process.execPath, [scriptPath, "production"], {
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        NEXT_PUBLIC_SITE_URL: "https://example.com"
      }
    });

    expect(result.status).toBe(0);
    expect(result.stdout.toString()).toContain("Environment validation passed");
  });
});
