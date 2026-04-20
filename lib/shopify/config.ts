export const shopifyConfig = {
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "universalleaner.myshopify.com",
  storefrontToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "",
  storefrontApiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2025-01"
};

export function isShopifyStorefrontConfigured() {
  return Boolean(shopifyConfig.storeDomain && shopifyConfig.storefrontToken);
}
