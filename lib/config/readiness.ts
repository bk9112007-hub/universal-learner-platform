type ReadinessCheck = {
  key: string;
  label: string;
  configured: boolean;
  required: boolean;
  category: "core" | "shopify" | "notifications" | "email";
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function buildChecks(): ReadinessCheck[] {
  return [
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      label: "Supabase URL",
      configured: hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
      required: true,
      category: "core"
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      label: "Supabase anon key",
      configured: hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      required: true,
      category: "core"
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      label: "Supabase service role key",
      configured: hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
      required: true,
      category: "core"
    },
    {
      key: "NEXT_PUBLIC_SITE_URL",
      label: "Public site URL",
      configured: hasValue(process.env.NEXT_PUBLIC_SITE_URL),
      required: true,
      category: "core"
    },
    {
      key: "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN",
      label: "Shopify store domain",
      configured: hasValue(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN),
      required: false,
      category: "shopify"
    },
    {
      key: "NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN",
      label: "Shopify storefront token",
      configured: hasValue(process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN),
      required: false,
      category: "shopify"
    },
    {
      key: "SHOPIFY_ADMIN_ACCESS_TOKEN",
      label: "Shopify admin token",
      configured: hasValue(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN),
      required: false,
      category: "shopify"
    },
    {
      key: "SHOPIFY_WEBHOOK_SECRET",
      label: "Shopify webhook secret",
      configured: hasValue(process.env.SHOPIFY_WEBHOOK_SECRET),
      required: false,
      category: "shopify"
    },
    {
      key: "NOTIFICATION_CRON_SECRET",
      label: "Notification cron secret",
      configured: hasValue(process.env.NOTIFICATION_CRON_SECRET) || hasValue(process.env.CRON_SECRET),
      required: false,
      category: "notifications"
    },
    {
      key: "EMAIL_PROVIDER",
      label: "Email provider",
      configured: hasValue(process.env.EMAIL_PROVIDER),
      required: false,
      category: "email"
    },
    {
      key: "EMAIL_FROM_ADDRESS",
      label: "Email from address",
      configured: hasValue(process.env.EMAIL_FROM_ADDRESS),
      required: false,
      category: "email"
    },
    {
      key: "RESEND_API_KEY",
      label: "Resend API key",
      configured: hasValue(process.env.RESEND_API_KEY),
      required: false,
      category: "email"
    }
  ];
}

export function getDeploymentReadiness() {
  const checks = buildChecks();
  const missingRequired = checks.filter((check) => check.required && !check.configured);

  return {
    status: missingRequired.length === 0 ? "ready" : "blocked",
    checks,
    missingRequired,
    features: {
      coreAppReady: missingRequired.length === 0,
      shopifyReady: checks.filter((check) => check.category === "shopify").every((check) => check.configured),
      cronReady: checks.some((check) => check.category === "notifications" && check.configured),
      emailReady:
        hasValue(process.env.EMAIL_PROVIDER) &&
        hasValue(process.env.EMAIL_FROM_ADDRESS) &&
        hasValue(process.env.RESEND_API_KEY)
    }
  };
}
