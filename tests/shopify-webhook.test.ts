import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuery, createSupabaseMock } from "@/tests/helpers/supabase";

describe("shopify purchase handling", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates pending access when the purchase email does not match a profile", async () => {
    const purchases = createQuery({
      singleResult: { data: { id: "purchase-1" }, error: null }
    });
    const programs = createQuery({
      awaitResult: {
        data: [{ id: "program-1", title: "Scholar", shopify_product_id: "111" }],
        error: null
      }
    });
    const profiles = createQuery({
      maybeSingleResult: { data: null, error: null }
    });
    const pending = createQuery({ awaitResult: { data: null, error: null } });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () =>
        createSupabaseMock({
          purchases,
          programs,
          profiles,
          pending_program_access: pending
        })
    }));

    const { processShopifyOrderWebhook } = await import("@/lib/shopify/webhook-processing");
    const result = await processShopifyOrderWebhook({
      id: 22,
      email: "buyer@example.com",
      total_price: "99.00",
      currency: "USD",
      financial_status: "paid",
      line_items: [{ product_id: 111 }]
    });

    expect(result.status).toBe(202);
    expect((result.body as any).processingState).toBe("pending_account");
  });

  it("grants enrollment when a matching profile exists", async () => {
    const purchases = createQuery({
      singleResult: { data: { id: "purchase-1" }, error: null }
    });
    const programs = createQuery({
      awaitResult: {
        data: [{ id: "program-1", title: "Scholar", shopify_product_id: "111" }],
        error: null
      }
    });
    const profiles = createQuery({
      maybeSingleResult: { data: { id: "student-1", role: "student" }, error: null }
    });
    const enrollments = createQuery({ awaitResult: { data: null, error: null } });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () =>
        createSupabaseMock({
          purchases,
          programs,
          profiles,
          enrollments
        })
    }));

    const { processShopifyOrderWebhook } = await import("@/lib/shopify/webhook-processing");
    const result = await processShopifyOrderWebhook({
      id: 22,
      email: "student@example.com",
      total_price: "99.00",
      currency: "USD",
      financial_status: "paid",
      line_items: [{ product_id: 111 }]
    });

    expect(result.status).toBe(200);
    expect((result.body as any).processingState).toBe("enrolled");
  });
});
