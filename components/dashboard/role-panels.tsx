import Link from "next/link";

import { programs } from "@/lib/content/site-content";
import type { UserRole } from "@/types/domain";

export function RolePanels({ role }: { role: UserRole }) {
  if (role === "student") {
    return (
      <section className="grid gap-6 xl:grid-cols-2">
        <article id="projects" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Submit Projects</h2>
          <p className="mt-2 text-slate-600">A server-backed version of your prototype submission flow with file uploads, due dates, and teacher review status.</p>
          <div className="mt-5 rounded-3xl bg-mist p-5 text-sm text-slate-700">
            Fields: title, subject, due date, team type, difficulty, description, attachments.
          </div>
        </article>
        <article id="assessments" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Assessments Dashboard</h2>
          <p className="mt-2 text-slate-600">Assignments, quizzes, and tests become real records with filters, deadlines, and completion states.</p>
          <div className="mt-5 rounded-3xl bg-brand-50 p-5 text-sm text-brand-900">
            Includes feedback, progress trends, and collaboration notes linked to each project.
          </div>
        </article>
      </section>
    );
  }

  if (role === "teacher") {
    return (
      <section className="grid gap-6 xl:grid-cols-2">
        <article id="classes" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Class Management</h2>
          <p className="mt-2 text-slate-600">Teachers can manage learners, create projects, organize classes, and track who needs support next.</p>
        </article>
        <article id="grading" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Review and Feedback</h2>
          <p className="mt-2 text-slate-600">Rubrics, grade entry, approvals, needs-revision states, and feedback history are all centralized here.</p>
        </article>
      </section>
    );
  }

  if (role === "parent") {
    return (
      <section className="grid gap-6 xl:grid-cols-2">
        <article id="progress" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Child Progress</h2>
          <p className="mt-2 text-slate-600">Parents get progress summaries, teacher feedback, milestone alerts, and session visibility without overwhelming detail.</p>
        </article>
        <article id="programs" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Programs and Purchases</h2>
          <p className="mt-2 text-slate-600">Shopify checkout links stay intact while purchases unlock consultation workflows and program access inside the portal.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {programs.map((program) => (
              <Link key={program.title} href={program.href} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-800">
                {program.title}
              </Link>
            ))}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <article id="users" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-semibold text-ink">User and Permission Management</h2>
        <p className="mt-2 text-slate-600">Admin tools manage role assignment, class ownership, parent-child relationships, and access control policies.</p>
      </article>
      <article id="analytics" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-semibold text-ink">Platform Analytics</h2>
        <p className="mt-2 text-slate-600">Track enrollment, engagement, review throughput, program conversions, and revenue synced from Shopify.</p>
      </article>
    </section>
  );
}
