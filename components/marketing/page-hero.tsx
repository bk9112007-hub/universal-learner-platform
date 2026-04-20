import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

type PageHeroProps = {
  programCount: number;
  articleCount: number;
  isShopifyLive: boolean;
};

export function PageHero({ programCount, articleCount, isShopifyLive }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0e2e63_0%,#1c5fd2_45%,#90c4ff_100%)]" />
      <div className="absolute inset-0 bg-hero-grid opacity-80" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 text-white sm:px-6 lg:grid-cols-[1.15fr,0.85fr] lg:px-8 lg:py-28">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Welcome to the future of education
          </div>
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-100">Expert tutoring for academic excellence</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Personalized learning, project-based growth, and premium academic support in one platform.
            </h1>
            <p className="max-w-2xl text-lg text-blue-50">
              Universal Learner now pairs your trusted tutoring brand with a secure full-stack workspace for students, teachers, parents, and administrators.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/book-consultation" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-soft transition hover:bg-blue-50">
              Book Your First Session
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/app/student" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Explore the Platform
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-blue-100">Programs</p>
              <p className="mt-2 text-3xl font-semibold">{programCount}</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-blue-100">Storefront</p>
              <p className="mt-2 text-3xl font-semibold">{isShopifyLive ? "Live from Shopify" : "Cached fallback"}</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-blue-100">Insights</p>
              <p className="mt-2 text-3xl font-semibold">{articleCount} latest</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-panel backdrop-blur-xl">
          <div className="rounded-[1.75rem] bg-white p-4 text-ink">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-mist p-5">
                <p className="text-sm text-slate-500">Student dashboard</p>
                <p className="mt-2 text-2xl font-semibold">Projects, assessments, progress</p>
              </div>
              <div className="rounded-3xl bg-brand-50 p-5">
                <p className="text-sm text-brand-700">Teacher workflow</p>
                <p className="mt-2 text-2xl font-semibold text-brand-900">Review, grade, coach, manage</p>
              </div>
              <div className="rounded-3xl border border-line p-5 sm:col-span-2">
                <div className="flex items-center gap-3 text-sm font-semibold text-success">
                  <ShieldCheck className="h-4 w-4" />
                  Protected role-based access
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  A single platform for public brand storytelling, secure tutoring operations, family visibility, and post-purchase enrollment unlocks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
