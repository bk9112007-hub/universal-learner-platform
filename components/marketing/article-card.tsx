import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ShopifyArticleSummary } from "@/types/domain";

function formatPublishedDate(publishedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(publishedAt));
}

export function ArticleCard({ article }: { article: ShopifyArticleSummary }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
      {article.imageUrl ? (
        <div className="relative aspect-[16/10] w-full bg-slate-100">
          <Image
            src={article.imageUrl}
            alt={article.imageAlt ?? article.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        </div>
      ) : null}

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
          <span>{article.blogHandle.replace(/-/g, " ")}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500">{formatPublishedDate(article.publishedAt)}</span>
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-ink">{article.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{article.excerpt}</p>
        {article.author ? <p className="mt-4 text-sm font-medium text-slate-500">By {article.author}</p> : null}
        <Link href={article.href} className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-700 hover:text-brand-700">
          Read article
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
