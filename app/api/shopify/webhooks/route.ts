import crypto from "crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { logEvent } from "@/lib/observability/logger";
import { SHOPIFY_CACHE_TAGS } from "@/lib/shopify/storefront";
import { processShopifyOrderWebhook } from "@/lib/shopify/webhook-processing";

function verifyShopifyWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature);

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

function getTagsForTopic(topic: string | null) {
  const normalized = topic?.toLowerCase() ?? "";

  if (normalized.startsWith("products/")) {
    return [SHOPIFY_CACHE_TAGS.all, SHOPIFY_CACHE_TAGS.products, SHOPIFY_CACHE_TAGS.collections];
  }

  if (normalized.startsWith("collections/")) {
    return [SHOPIFY_CACHE_TAGS.all, SHOPIFY_CACHE_TAGS.products, SHOPIFY_CACHE_TAGS.collections];
  }

  if (normalized.startsWith("articles/") || normalized.startsWith("blogs/")) {
    return [SHOPIFY_CACHE_TAGS.all, SHOPIFY_CACHE_TAGS.articles];
  }

  return [];
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");

  if (!verifyShopifyWebhook(rawBody, signature)) {
    logEvent("warn", "shopify.webhook", "Rejected webhook with invalid signature.", {
      hasSecret: Boolean(process.env.SHOPIFY_WEBHOOK_SECRET),
      hasSignature: Boolean(signature)
    });
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logEvent("warn", "shopify.webhook", "Rejected webhook with invalid JSON payload.");
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const contentTags = getTagsForTopic(topic);
  if (contentTags.length > 0) {
    contentTags.forEach((tag) => revalidateTag(tag));
    logEvent("info", "shopify.webhook", "Revalidated Shopify storefront content tags.", {
      topic,
      tags: contentTags
    });

    return NextResponse.json(
      {
        revalidated: true,
        topic,
        tags: contentTags
      },
      { status: 200 }
    );
  }

  const result = await processShopifyOrderWebhook(payload);
  if (!result.ok || result.status >= 400) {
    logEvent("error", "shopify.webhook", "Webhook processing returned an error response.", {
      status: result.status,
      body: result.body
    });
  }
  return NextResponse.json(result.body, { status: result.status });
}
