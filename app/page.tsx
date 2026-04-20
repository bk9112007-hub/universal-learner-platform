import Link from "next/link";
import { ArrowRight, BadgeCheck, GraduationCap, Handshake, Shield } from "lucide-react";

import { ArticleCard } from "@/components/marketing/article-card";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionShell } from "@/components/marketing/section-shell";
import { ShopifyCollectionCard } from "@/components/marketing/shopify-collection-card";
import { ShopifyProductCard } from "@/components/marketing/shopify-product-card";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { expertiseCards, subjects, testimonials, tutoringSteps } from "@/lib/content/site-content";
import { getShopifyMarketingContent } from "@/lib/shopify/storefront";

export default async function HomePage() {
  const { products, collections, articles, isLive } = await getShopifyMarketingContent();

  return (
    <div>
      <SiteHeader />
      <PageHero programCount={products.length} articleCount={articles.length} isShopifyLive={isLive} />

      <SectionShell
        eyebrow="Our Expertise"
        title="Learning experiences designed to build confidence, mastery, and momentum."
        description="The live Shopify brand emphasizes trusted tutoring and high-touch support. This rebuild preserves that tone while extending it into a polished SaaS platform."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {expertiseCards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-xl font-semibold text-ink">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="How It Works"
        title="A tutoring method that feels personal, structured, and accountable."
        description="These steps are pulled directly from the current brand messaging and now map cleanly into consultations, onboarding, and dashboard milestones."
        className="pt-0"
      >
        <div className="grid gap-4 lg:grid-cols-4">
          {tutoringSteps.map((step, index) => (
            <article key={step} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">Step {index + 1}</p>
              <p className="mt-4 text-sm leading-6 text-slate-700">{step}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Programs"
        title="Commerce-ready offers that stay connected to your operational platform."
        description="Products now come directly from Shopify's Storefront API so your custom website stays aligned with live catalog changes, pricing, and merchandising."
        className="pt-0"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {products.map((product) => (
            <ShopifyProductCard key={product.id} product={product} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Collections"
        title="Featured Shopify collections merchandised inside the premium marketing site."
        description="Collections update automatically through Shopify and are cached in Next.js for fast page loads."
        className="pt-0"
      >
        {collections.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-4">
            {collections.map((collection) => (
              <ShopifyCollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-soft">
            Add Shopify collections and a storefront token to feature curated offers here automatically.
          </div>
        )}
      </SectionShell>

      <SectionShell
        eyebrow="Platform Experience"
        title="Your prototype dashboard concepts now live inside a scalable full-stack product."
        description="Projects, assessments, feedback, whiteboard collaboration, profile management, and role-based visibility all evolve from the original HTML/CSS/JS prototype."
        className="pt-0"
      >
        <div className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Student submissions with storage-backed uploads",
                "Teacher grading and feedback tools",
                "Parent visibility with purchase-linked access",
                "Admin analytics, permissions, and program controls"
              ].map((item) => (
                <div key={item} className="rounded-3xl bg-mist p-5 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[
              { icon: Shield, title: "Protected routes", copy: "Supabase auth plus middleware guard every app workspace." },
              { icon: BadgeCheck, title: "Row-level security", copy: "Each role sees only the data it should be allowed to access." },
              { icon: Handshake, title: "Commerce unlocks", copy: "Shopify purchases trigger enrollment and entitlements through webhooks." }
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
                  <Icon className="h-6 w-6 text-brand-700" />
                  <h3 className="mt-4 text-xl font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Testimonials"
        title="Stories that create trust still deserve a prime place in the new experience."
        description="The existing Shopify site uses student wins and community tone as trust signals. We keep that human layer front and center."
        className="pt-0"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.quote} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-lg leading-8 text-ink">“{testimonial.quote}”</p>
              <p className="mt-6 font-semibold text-ink">{testimonial.name}</p>
              <p className="text-sm text-slate-500">{testimonial.role}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Insights"
        title="Blog content now flows straight from Shopify into the custom website."
        description="Publish once in Shopify and the latest articles appear here and in the dedicated insights section with cached server rendering."
        className="pt-0"
      >
        {articles.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-soft">
            Publish Shopify blog content to populate this section automatically.
          </div>
        )}
      </SectionShell>

      <SectionShell
        eyebrow="Subjects We Teach"
        title="Academic support across core subjects and interdisciplinary growth."
        description="We preserve the current subject mix while making room for programs, student dashboards, and outcomes reporting."
        className="pt-0"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <div key={subject} className="rounded-full border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-soft">
              {subject}
            </div>
          ))}
        </div>
      </SectionShell>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#0e2e63_0%,#236bdb_100%)] px-8 py-10 text-white shadow-panel">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-100">Ready to Launch</p>
              <h2 className="mt-3 text-4xl font-semibold">A premium education brand on the outside, a robust role-based platform on the inside.</h2>
              <p className="mt-4 text-blue-50">
                Start with the homepage, connect auth, and extend into dashboards without losing the warmth and trust of the current brand.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-blue-50">
                Login / Sign Up
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/methods" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Explore Methods
                <GraduationCap className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
