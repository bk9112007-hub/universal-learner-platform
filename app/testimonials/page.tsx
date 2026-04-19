import { SectionShell } from "@/components/marketing/section-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { testimonials } from "@/lib/content/site-content";

export default function TestimonialsPage() {
  return (
    <div>
      <SiteHeader compact />
      <SectionShell
        eyebrow="Testimonials"
        title="Learner wins and family trust are part of the product."
        description="The current brand relies on real outcomes and encouragement. This page keeps that human proof prominent."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.quote} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-xl leading-8 text-ink">“{testimonial.quote}”</p>
              <p className="mt-6 font-semibold text-ink">{testimonial.name}</p>
              <p className="text-sm text-slate-500">{testimonial.role}</p>
            </article>
          ))}
        </div>
      </SectionShell>
      <SiteFooter />
    </div>
  );
}
