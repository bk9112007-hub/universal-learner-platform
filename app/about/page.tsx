import { SectionShell } from "@/components/marketing/section-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function AboutPage() {
  return (
    <div>
      <SiteHeader compact />
      <SectionShell
        eyebrow="About"
        title="A trusted partner in educational excellence."
        description="This language is adapted from the current Shopify site and expanded into a stronger brand story for a full-stack platform."
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <p className="leading-8 text-slate-700">
              Universal Learner is built around personalized support, proven teaching methods, and a belief that students thrive when learning feels both challenging and deeply supportive. The platform combines tutoring, project-based learning, and progress visibility so every stakeholder can contribute to growth.
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-slate-200 bg-brand-50 p-6 shadow-soft">
            <h2 className="text-2xl font-semibold text-brand-900">Why families choose Universal Learner</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-brand-900">
              <li>Personalized instruction instead of one-size-fits-all pacing.</li>
              <li>Certified educators and structured accountability.</li>
              <li>Clear communication across students, parents, and teachers.</li>
              <li>Programs that connect tutoring to durable academic confidence.</li>
            </ul>
          </article>
        </div>
      </SectionShell>
      <SiteFooter />
    </div>
  );
}
