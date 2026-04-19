import { SectionShell } from "@/components/marketing/section-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { expertiseCards, tutoringSteps } from "@/lib/content/site-content";

export default function MethodsPage() {
  return (
    <div>
      <SiteHeader compact />
      <SectionShell
        eyebrow="Methods"
        title="Our expertise blends tutoring excellence with real-world learning design."
        description="This page translates the Shopify site's expertise messaging into a clearer premium service narrative."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {expertiseCards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-semibold text-ink">{card.title}</h2>
              <p className="mt-3 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </SectionShell>
      <SectionShell title="How our tutoring works" description="Assessment, planning, tutoring, and progress tracking become a repeatable service system.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tutoringSteps.map((step, index) => (
            <div key={step} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">Step {index + 1}</p>
              <p className="mt-4 text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </SectionShell>
      <SiteFooter />
    </div>
  );
}
