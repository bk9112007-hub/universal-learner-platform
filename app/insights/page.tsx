import { ArticleCard } from "@/components/marketing/article-card";
import { SectionShell } from "@/components/marketing/section-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getLatestStorefrontArticles } from "@/lib/shopify/storefront";

export default async function InsightsPage() {
  const articles = await getLatestStorefrontArticles(12);

  return (
    <div>
      <SiteHeader compact />
      <SectionShell
        eyebrow="Insights"
        title="Blog articles published in Shopify, presented in a faster custom experience."
        description="This page is driven by Shopify blog content so your editorial updates appear across the marketing site automatically."
      >
        {articles.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-soft">
            No Shopify articles are published yet.
          </div>
        )}
      </SectionShell>
      <SiteFooter />
    </div>
  );
}
