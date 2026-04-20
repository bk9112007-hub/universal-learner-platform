import { config } from "dotenv";

config({ path: ".env.local" });
config();
const mode = process.argv[2] ?? "production";

const requiredByMode = {
  development: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SITE_URL"
  ],
  production: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SITE_URL"
  ]
};

const optionalGroups = [
  {
    label: "Shopify commerce",
    vars: ["NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN", "NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN", "SHOPIFY_ADMIN_ACCESS_TOKEN", "SHOPIFY_WEBHOOK_SECRET"]
  },
  {
    label: "Reminder cron automation",
    vars: ["NOTIFICATION_CRON_SECRET", "CRON_SECRET"]
  },
  {
    label: "Email delivery",
    vars: ["EMAIL_PROVIDER", "EMAIL_FROM_ADDRESS", "RESEND_API_KEY"]
  }
];

function formatVar(name) {
  return `- ${name}`;
}

const required = requiredByMode[mode] ?? requiredByMode.production;
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error("\nEnvironment validation failed.\n");
  console.error("Missing required environment variables:");
  console.error(missing.map(formatVar).join("\n"));
  console.error("\nFix:");
  console.error("1. Copy .env.example to .env.local or configure these values in your deployment provider.");
  console.error("2. Re-run the command after the required vars are present.\n");
  process.exit(1);
}

const warnings = optionalGroups
  .map((group) => ({
    ...group,
    missing: group.vars.filter((name) => !process.env[name]?.trim())
  }))
  .filter((group) => group.missing.length === group.vars.length);

if (warnings.length > 0) {
  console.warn("\nEnvironment validation warnings:");
  for (const warning of warnings) {
    console.warn(`- ${warning.label} is not fully configured yet.`);
  }
  console.warn("  The app can still boot, but those features will fall back safely or stay inactive.\n");
}

console.log(`Environment validation passed for ${mode}.`);
