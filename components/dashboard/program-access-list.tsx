import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

import type { ProgramAccessRecord } from "@/types/domain";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

export function ProgramAccessList({ programs }: { programs: ProgramAccessRecord[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {programs.map((program) => (
        <article key={program.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-ink">{program.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{program.description}</p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                program.isEnrolled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
              }`}
            >
              {program.isEnrolled ? "Access Granted" : "Locked"}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Price</p>
              <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(program.priceCents)}</p>
              {program.accessSource === "linked-child" ? (
                <p className="mt-2 text-sm text-slate-600">Accessible through linked child enrollment for {program.enrollmentUserName}.</p>
              ) : null}
            </div>
            {program.isEnrolled ? (
              <Link
                href={`/app/programs/${program.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Open program
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">
                <LockKeyhole className="h-4 w-4" />
                Purchase required
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
