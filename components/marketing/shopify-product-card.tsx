import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ShopifyProductSummary } from "@/types/domain";

export function ShopifyProductCard({ product }: { product: ShopifyProductSummary }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
      {product.featuredImageUrl ? (
        <div className="relative aspect-[16/10] w-full bg-slate-100">
          <Image
            src={product.featuredImageUrl}
            alt={product.featuredImageAlt ?? product.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-end bg-[linear-gradient(135deg,#dbeafe_0%,#eff6ff_100%)] p-6">
          <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-800">Program</div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-ink">{product.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
          </div>
          {product.badge ? <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">{product.badge}</span> : null}
        </div>

        {product.collectionTitles.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.collectionTitles.slice(0, 3).map((title) => (
              <span key={title} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {title}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Starts at</p>
            <p className="text-3xl font-semibold text-ink">{product.price}</p>
          </div>
          <Link href={product.href} className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">
            {product.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
