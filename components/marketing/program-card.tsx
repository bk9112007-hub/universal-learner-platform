import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Program } from "@/types/domain";

export function ProgramCard({ program }: { program: Program }) {
  return (
    <article className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-ink">{program.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{program.description}</p>
        </div>
        {program.badge ? <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">{program.badge}</span> : null}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Starts at</p>
          <p className="text-3xl font-semibold text-ink">{program.price}</p>
        </div>
        <Link href={program.href} className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">
          {program.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
