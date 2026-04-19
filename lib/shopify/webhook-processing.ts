import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/observability/logger";

type ShopifyOrderPayload = {
  id?: number;
  email?: string;
  total_price?: string;
  currency?: string;
  financial_status?: string;
  line_items?: Array<{ product_id?: number; title?: string }>;
};

function normalizeEmail(email: string | undefined | null) {
  return email?.trim().toLowerCase() ?? null;
}

function parseAmountCents(amount: string | undefined) {
  if (!amount) {
    return null;
  }

  const parsed = Number(amount);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

export async function processShopifyOrderWebhook(payload: ShopifyOrderPayload) {
  const supabase = createAdminClient();

  if (!payload.id) {
    logEvent("warn", "shopify.processing", "Missing Shopify order id in webhook payload.");
    return {
      ok: false,
      status: 400,
      body: { error: "Missing Shopify order id." }
    };
  }

  const email = normalizeEmail(payload.email);
  const productIds = (payload.line_items ?? []).map((item) => String(item.product_id ?? "")).filter(Boolean);

  const initialPurchase = {
    shopify_order_id: String(payload.id),
    email,
    amount_cents: parseAmountCents(payload.total_price),
    currency: payload.currency ?? null,
    status: payload.financial_status ?? "paid",
    processing_state: "received",
    processing_error: null,
    raw_payload: payload
  };

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .upsert(initialPurchase, { onConflict: "shopify_order_id" })
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    logEvent("error", "shopify.processing", "Unable to persist purchase record.", {
      error: purchaseError?.message ?? null,
      orderId: payload.id
    });
    return {
      ok: false,
      status: 500,
      body: { error: purchaseError?.message ?? "Unable to persist purchase." }
    };
  }

  if (productIds.length === 0) {
    logEvent("warn", "shopify.processing", "Order did not include line items with product ids.", {
      orderId: payload.id
    });
    await supabase
      .from("purchases")
      .update({
        processing_state: "no_line_items",
        processing_error: "The order did not include product ids that could be mapped to programs."
      })
      .eq("id", purchase.id);

    return {
      ok: true,
      status: 202,
      body: {
        received: true,
        orderId: payload.id,
        purchaseId: purchase.id,
        processingState: "no_line_items"
      }
    };
  }

  const { data: programs, error: programError } = await supabase
    .from("programs")
    .select("id, title, shopify_product_id")
    .in("shopify_product_id", productIds);

  if (programError) {
    logEvent("error", "shopify.processing", "Program lookup failed for webhook purchase.", {
      error: programError.message,
      orderId: payload.id
    });
    await supabase
      .from("purchases")
      .update({
        processing_state: "program_lookup_failed",
        processing_error: programError.message
      })
      .eq("id", purchase.id);

    return {
      ok: false,
      status: 500,
      body: { error: programError.message, purchaseId: purchase.id }
    };
  }

  if (!programs || programs.length === 0) {
    logEvent("warn", "shopify.processing", "Webhook purchase did not map to any platform program.", {
      orderId: payload.id,
      productIds
    });
    await supabase
      .from("purchases")
      .update({
        processing_state: "unmapped_product",
        processing_error: "No platform program matched the Shopify product ids on this order."
      })
      .eq("id", purchase.id);

    return {
      ok: true,
      status: 202,
      body: {
        received: true,
        orderId: payload.id,
        purchaseId: purchase.id,
        processingState: "unmapped_product"
      }
    };
  }

  const unmatchedCount = Math.max(productIds.length - programs.length, 0);
  const partialMappingMessage =
    unmatchedCount > 0 ? `${unmatchedCount} Shopify product${unmatchedCount === 1 ? "" : "s"} on this order did not map to a platform program.` : null;

  if (!email) {
    logEvent("warn", "shopify.processing", "Webhook purchase did not include a customer email.", {
      orderId: payload.id
    });
    await supabase
      .from("purchases")
      .update({
        processing_state: "missing_email",
        processing_error: "The Shopify order did not include a customer email, so enrollment could not be assigned."
      })
      .eq("id", purchase.id);

    return {
      ok: true,
      status: 202,
      body: {
        received: true,
        orderId: payload.id,
        purchaseId: purchase.id,
        processingState: "missing_email"
      }
    };
  }

  const { data: matchedProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    logEvent("error", "shopify.processing", "Profile lookup failed for purchase email.", {
      error: profileError.message,
      email,
      orderId: payload.id
    });
    await supabase
      .from("purchases")
      .update({
        processing_state: "profile_lookup_failed",
        processing_error: profileError.message
      })
      .eq("id", purchase.id);

    return {
      ok: false,
      status: 500,
      body: { error: profileError.message, purchaseId: purchase.id }
    };
  }

  if (!matchedProfile) {
    const { error: pendingError } = await supabase.from("pending_program_access").upsert(
      programs.map((program: any) => ({
        email,
        program_id: program.id,
        purchase_id: purchase.id,
        status: "pending"
      })),
      { onConflict: "email,program_id,purchase_id" }
    );

    if (pendingError) {
      logEvent("error", "shopify.processing", "Failed to create pending access rows.", {
        error: pendingError.message,
        email,
        orderId: payload.id
      });
      await supabase
        .from("purchases")
        .update({
          processing_state: "pending_access_failed",
          processing_error: pendingError.message
        })
        .eq("id", purchase.id);

      return {
        ok: false,
        status: 500,
        body: { error: pendingError.message, purchaseId: purchase.id }
      };
    }

    await supabase
      .from("purchases")
      .update({
        processing_state: "pending_account",
        processing_error:
          partialMappingMessage ??
          "No platform account matched the purchase email yet. Access is waiting to be claimed."
      })
      .eq("id", purchase.id);

    logEvent("info", "shopify.processing", "Stored purchase as pending account access.", {
      email,
      orderId: payload.id,
      mappedPrograms: programs.length
    });
    return {
      ok: true,
      status: 202,
      body: {
        received: true,
        orderId: payload.id,
        purchaseId: purchase.id,
        processingState: "pending_account",
        mappedPrograms: programs.length,
        unmappedProducts: unmatchedCount
      }
    };
  }

  const { error: enrollmentError } = await supabase.from("enrollments").upsert(
    programs.map((program: any) => ({
      user_id: matchedProfile.id,
      program_id: program.id,
      source_purchase_id: purchase.id,
      status: "active"
    })),
    { onConflict: "user_id,program_id" }
  );

  if (enrollmentError) {
    logEvent("error", "shopify.processing", "Enrollment upsert failed for purchase.", {
      error: enrollmentError.message,
      userId: matchedProfile.id,
      orderId: payload.id
    });
    await supabase
      .from("purchases")
      .update({
        user_id: matchedProfile.id,
        processing_state: "enrollment_failed",
        processing_error: enrollmentError.message
      })
      .eq("id", purchase.id);

    return {
      ok: false,
      status: 500,
      body: { error: enrollmentError.message, purchaseId: purchase.id }
    };
  }

  await supabase
    .from("purchases")
    .update({
      user_id: matchedProfile.id,
      processing_state: unmatchedCount > 0 ? "partially_enrolled" : "enrolled",
      processing_error: partialMappingMessage
    })
    .eq("id", purchase.id);

  logEvent("info", "shopify.processing", "Purchase successfully granted enrollment.", {
    userId: matchedProfile.id,
    orderId: payload.id,
    mappedPrograms: programs.length,
    unmappedProducts: unmatchedCount
  });
  return {
    ok: true,
    status: 200,
    body: {
      received: true,
      orderId: payload.id,
      purchaseId: purchase.id,
      processingState: unmatchedCount > 0 ? "partially_enrolled" : "enrolled",
      mappedPrograms: programs.length,
      unmappedProducts: unmatchedCount,
      matchedUserId: matchedProfile.id
    }
  };
}
