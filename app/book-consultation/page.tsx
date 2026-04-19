import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function BookConsultationPage() {
  return (
    <div>
      <SiteHeader compact />
      <SectionShell
        eyebrow="Consultation"
        title="Schedule a free consultation."
        description="The Shopify site already emphasizes consultations. This page turns that CTA into a richer conversion and intake experience."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-semibold text-ink">What happens next</h2>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
              <li>1. Share your goals, learner profile, and current challenges.</li>
              <li>2. We recommend a tutoring plan, program fit, and next best action.</li>
              <li>3. After purchase, Shopify webhook sync unlocks your portal access.</li>
            </ol>
          </article>
          <article className="rounded-[1.75rem] border border-slate-200 bg-brand-50 p-6 shadow-soft">
            <h2 className="text-2xl font-semibold text-brand-900">Production note</h2>
            <p className="mt-3 text-sm leading-6 text-brand-900">
              A real version can write to a `consultation_requests` table, notify admins, and offer a calendar embed or booking automation.
            </p>
            <Link href="/contact" className="mt-6 inline-flex rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
              Contact Us Instead
            </Link>
          </article>
        </div>
      </SectionShell>
      <SiteFooter />
    </div>
  );
}
