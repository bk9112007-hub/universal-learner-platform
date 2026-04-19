import { cn } from "@/lib/utils";

export function DashboardSection({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft", className)}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-soft">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </article>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export function StatusBadge({
  status
}: {
  status: "draft" | "submitted" | "reviewed" | "needs_revision" | "assigned" | "graded";
}) {
  const labelMap = {
    draft: "Draft",
    submitted: "Submitted",
    reviewed: "Reviewed",
    needs_revision: "Needs Revision",
    assigned: "Assigned",
    graded: "Graded"
  };

  const styleMap = {
    draft: "bg-slate-100 text-slate-700",
    submitted: "bg-brand-50 text-brand-800",
    reviewed: "bg-emerald-50 text-emerald-700",
    needs_revision: "bg-amber-50 text-amber-700",
    assigned: "bg-slate-100 text-slate-700",
    graded: "bg-emerald-50 text-emerald-700"
  };

  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", styleMap[status])}>{labelMap[status]}</span>;
}
