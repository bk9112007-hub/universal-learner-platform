import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery, createSupabaseMock } from "@/tests/helpers/supabase";

describe("notification automation and preferences", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("updates a user notification preference", async () => {
    const supabase = createSupabaseMock({
      notification_user_preferences: createQuery({ awaitResult: { data: null, error: null } })
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

    const { updateNotificationPreferenceAction } = await import("@/lib/notifications/actions");
    const formData = new FormData();
    formData.set("type", "student_due_soon");
    formData.set("inAppEnabled", "true");
    formData.set("emailEnabled", "false");

    await expect(updateNotificationPreferenceAction({}, formData)).resolves.toEqual({
      success: "Notification preference updated."
    });
  });

  it("authorizes and runs the scheduled notification sync endpoint", async () => {
    vi.stubEnv("NOTIFICATION_CRON_SECRET", "secret");
    vi.doMock("@/lib/notifications/service", () => ({
      syncNotificationsForAllUsers: vi.fn(async () => ({
        runId: "run-1",
        usersProcessed: 3,
        notificationsCreated: 4,
        emailsAttempted: 2,
        emailsSent: 2,
        emailsFailed: 0
      }))
    }));

    const { POST } = await import("@/app/api/notifications/sync/route");
    const response = await POST(
      new Request("http://localhost:3000/api/notifications/sync", {
        method: "POST",
        headers: { authorization: "Bearer secret" }
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.runId).toBe("run-1");
  });

  it("rejects an invalid Shopify webhook signature", async () => {
    vi.stubEnv("SHOPIFY_WEBHOOK_SECRET", "shop-secret");
    const payload = JSON.stringify({ id: 1 });

    const { POST } = await import("@/app/api/shopify/webhooks/route");
    const response = await POST(
      new Request("http://localhost:3000/api/shopify/webhooks", {
        method: "POST",
        body: payload,
        headers: { "x-shopify-hmac-sha256": "bad-signature" }
      })
    );

    expect(response.status).toBe(401);
  });

  it("accepts a valid Shopify webhook signature", async () => {
    vi.stubEnv("SHOPIFY_WEBHOOK_SECRET", "shop-secret");
    const payload = JSON.stringify({ id: 1 });
    const signature = crypto.createHmac("sha256", "shop-secret").update(payload, "utf8").digest("base64");

    vi.doMock("@/lib/shopify/webhook-processing", () => ({
      processShopifyOrderWebhook: vi.fn(async () => ({
        ok: true,
        status: 200,
        body: { received: true }
      }))
    }));

    const { POST } = await import("@/app/api/shopify/webhooks/route");
    const response = await POST(
      new Request("http://localhost:3000/api/shopify/webhooks", {
        method: "POST",
        body: payload,
        headers: { "x-shopify-hmac-sha256": signature }
      })
    );

    expect(response.status).toBe(200);
  });
});
