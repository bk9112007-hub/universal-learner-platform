"use client";

import { useActionState } from "react";

import { saveSkillDiagnosticAction, type PersonalizedProjectActionState } from "@/lib/projects/personalization";
import { getSkillBandLabel } from "@/lib/projects/personalization-engine";
import type { SkillBand, SkillDiagnosticRecord } from "@/types/domain";

const initialState: PersonalizedProjectActionState = {};
const bands: SkillBand[] = ["well_below", "below", "at", "above", "advanced"];
const subjects = [
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "math", label: "Math" },
  { key: "history", label: "History" },
  { key: "logic", label: "Logic" }
] as const;

export function SkillDiagnosticForm({ initialValue }: { initialValue: SkillDiagnosticRecord | null }) {
  const [state, action] = useActionState(saveSkillDiagnosticAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {subjects.map((subject) => (
        <label key={subject.key} className="block text-sm font-semibold text-slate-700">
          {subject.label}
          <select
            name={subject.key}
            defaultValue={initialValue?.[subject.key] ?? ""}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          >
            <option value="">Select level</option>
            {bands.map((band) => (
              <option key={band} value={band}>
                {getSkillBandLabel(band)}
              </option>
            ))}
          </select>
        </label>
      ))}
      {state.error ? <p className="md:col-span-2 xl:col-span-5 text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 xl:col-span-5 text-sm text-emerald-700">{state.success}</p> : null}
      <div className="md:col-span-2 xl:col-span-5">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Save skill diagnostic
        </button>
      </div>
    </form>
  );
}
