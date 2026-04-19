import { ProgramCard } from "@/components/marketing/program-card";
import { SectionShell } from "@/components/marketing/section-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { programs } from "@/lib/content/site-content";

export default function ProgramsPage() {
  return (
    <div>
      <SiteHeader compact />
      <SectionShell
        eyebrow="Programs"
        title="Tutoring and learning programs built for momentum."
        description="Shopify remains the source of truth for products and checkout. This site becomes the premium front door and post-purchase experience."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.title} program={program} />
          ))}
        </div>
      </SectionShell>
      <SiteFooter />
    </div>
  );
}
