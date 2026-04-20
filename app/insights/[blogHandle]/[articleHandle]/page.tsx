import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionShell } from "@/components/marketing/section-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { shopifyConfig } from "@/lib/shopify/config";
import { getStorefrontArticleByHandle } from "@/lib/shopify/storefront";

type PageProps = {
  params: Promise<{
    blogHandle: string;
    articleHandle: string;
  }>;
};

function formatPublishedDate(publishedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(publishedAt));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { blogHandle, articleHandle } = await params;
  const article = await getStorefrontArticleByHandle(blogHandle, articleHandle);

  if (!article) {
    return {
      title: "Article Not Found"
    };
  }

  return {
    title: article.title,
    description: article.excerpt
  };
}

export default async function InsightArticlePage({ params }: PageProps) {
  const { blogHandle, articleHandle } = await params;
  const article = await getStorefrontArticleByHandle(blogHandle, articleHandle);

  if (!article) {
    notFound();
  }

  return (
    <div>
      <SiteHeader compact />
      <SectionShell eyebrow={article.blogTitle} title={article.title} description={article.excerpt}>
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
              <span>{formatPublishedDate(article.publishedAt)}</span>
              {article.author ? <span>By {article.author}</span> : null}
            </div>

            {article.imageUrl ? (
              <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-[1.5rem] bg-slate-100">
                <Image
                  src={article.imageUrl}
                  alt={article.imageAlt ?? article.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 1024px, 100vw"
                />
              </div>
            ) : null}

            <article
              className="prose prose-slate mt-8 max-w-none prose-headings:font-semibold prose-a:text-brand-700"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/insights" className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-700 hover:text-brand-700">
                Back to insights
              </Link>
              <Link
                href={`https://${shopifyConfig.storeDomain}/blogs/${article.blogHandle}/${article.handle}`}
                className="inline-flex items-center rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                View on Shopify
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>
      <SiteFooter />
    </div>
  );
}
