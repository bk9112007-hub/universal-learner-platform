import { cn } from "@/lib/utils";

export function SectionShell({
  eyebrow,
  title,
  description,
  children,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", className)}>
      <div className="mb-8 max-w-3xl space-y-3">
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">{eyebrow}</p> : null}
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>
        {description ? <p className="text-lg text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
