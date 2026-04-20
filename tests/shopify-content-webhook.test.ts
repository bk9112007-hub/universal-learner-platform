import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const processShopifyOrderWebhook = vi.fn();

function signPayload(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

describe("shopify content webhook revalidation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.SHOPIFY_WEBHOOK_SECRET = "test-secret";
  });

  it("revalidates product cache tags for product webhooks", async () => {
    vi.doMock("next/cache", async (importOriginal) => {
      const actual = await importOriginal<typeof import("next/cache")>();
      return {
        ...actual,
        revalidateTag
      };
    });

    vi.doMock("@/lib/shopify/webhook-processing", () => ({
      processShopifyOrderWebhook
    }));

    const { POST } = await import("@/app/api/shopify/webhooks/route");

    const body = JSON.stringify({ id: 1 });
    const response = await POST(
      new Request("http://localhost/api/shopify/webhooks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-shopify-topic": "products/update",
          "x-shopify-hmac-sha256": signPayload(body, "test-secret")
        },
        body
      })
    );

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("shopify:all");
    expect(revalidateTag).toHaveBeenCalledWith("shopify:products");
    expect(processShopifyOrderWebhook).not.toHaveBeenCalled();
  });
});
