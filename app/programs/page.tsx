import { SectionShell } from "@/components/marketing/section-shell";
import { ShopifyCollectionCard } from "@/components/marketing/shopify-collection-card";
import { ShopifyProductCard } from "@/components/marketing/shopify-product-card";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getFeaturedStorefrontCollections, getFeaturedStorefrontProducts } from "@/lib/shopify/storefront";

export default async function ProgramsPage() {
  const [products, collections] = await Promise.all([
    getFeaturedStorefrontProducts(12),
    getFeaturedStorefrontCollections(6)
  ]);

  return (
    <div>
      <SiteHeader compact />
      <SectionShell
        eyebrow="Programs"
        title="Tutoring and learning programs built for momentum."
        description="Products and collections are pulled directly from Shopify so merchandising, pricing, and content updates flow into the custom website automatically."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {products.map((product) => (
            <ShopifyProductCard key={product.id} product={product} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Collections"
        title="Organized offers straight from your Shopify catalog."
        description="Use Shopify collections to control how programs are grouped here without changing your Next.js code."
        className="pt-0"
      >
        {collections.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {collections.map((collection) => (
              <ShopifyCollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-soft">
            No Shopify collections are currently available for the public programs page.
          </div>
        )}
      </SectionShell>
      <SiteFooter />
    </div>
  );
}
