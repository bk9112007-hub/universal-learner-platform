import { SectionShell } from "@/components/marketing/section-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function ContactPage() {
  return (
    <div>
      <SiteHeader compact />
      <SectionShell
        eyebrow="Contact"
        title="Start the conversation."
        description="A production version would persist inquiries to Supabase and optionally trigger CRM workflows."
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-semibold text-ink">Reach Universal Learner</h2>
            <p className="mt-3 text-slate-600">Use this page for inquiries, tutoring questions, partnership requests, or program support.</p>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <p>Email: hello@universallearner.com</p>
              <p>Consultations: Available by booking request</p>
              <p>Support: Parent, teacher, and student assistance included after enrollment</p>
            </div>
          </article>
          <form className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="grid gap-4">
              <input className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Full name" />
              <input className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Email address" />
              <textarea className="min-h-40 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="How can we help?" />
              <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
                Send Inquiry
              </button>
            </div>
          </form>
        </div>
      </SectionShell>
      <SiteFooter />
    </div>
  );
}
