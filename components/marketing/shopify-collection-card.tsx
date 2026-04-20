import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ShopifyCollectionSummary } from "@/types/domain";

export function ShopifyCollectionCard({ collection }: { collection: ShopifyCollectionSummary }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
      {collection.imageUrl ? (
        <div className="relative aspect-[16/10] w-full bg-slate-100">
          <Image
            src={collection.imageUrl}
            alt={collection.imageAlt ?? collection.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 25vw, 100vw"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-end bg-[linear-gradient(135deg,#ecfeff_0%,#eff6ff_100%)] p-6">
          <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-800">Collection</div>
        </div>
      )}

      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">{collection.productCountLabel}</p>
        <h3 className="mt-3 text-2xl font-semibold text-ink">{collection.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{collection.description}</p>

        {collection.featuredProductTitles.length > 0 ? (
          <ul className="mt-5 space-y-2 text-sm text-slate-600">
            {collection.featuredProductTitles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        ) : null}

        <Link
          href={collection.href}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-700 hover:text-brand-700"
        >
          View collection
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
