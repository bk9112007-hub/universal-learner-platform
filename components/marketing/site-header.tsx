import Link from "next/link";

import { marketingNav } from "@/lib/content/site-content";
import { cn } from "@/lib/utils";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-700 text-sm font-bold text-white shadow-soft">
            UL
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">Universal Learner</div>
            <div className={cn("text-sm text-slate-600", compact && "hidden sm:block")}>
              Premium tutoring, PBL, and family support
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 transition hover:text-brand-700">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex">
            Login
          </Link>
          <Link href="/book-consultation" className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-800">
            Book Consultation
          </Link>
        </div>
      </div>
    </header>
  );
}
