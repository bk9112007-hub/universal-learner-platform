import Link from "next/link";

import { marketingNav } from "@/lib/content/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr,0.8fr] lg:px-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">Universal Learner</p>
          <h2 className="max-w-xl text-2xl font-semibold text-ink">
            Trusted educational support for students, teachers, and families who want stronger outcomes with more clarity.
          </h2>
          <p className="max-w-2xl text-sm text-slate-600">
            This platform combines a premium public brand experience with secure dashboards, progress tracking, feedback tools, and Shopify-powered enrollment.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-brand-700">
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="text-sm font-medium text-slate-600 transition hover:text-brand-700">
            Login / Sign Up
          </Link>
        </div>
      </div>
    </footer>
  );
}
