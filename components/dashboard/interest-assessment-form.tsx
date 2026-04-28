"use client";

import { useActionState } from "react";

import { saveInterestAssessmentAction, type PersonalizedProjectActionState } from "@/lib/projects/personalization";
import type { InterestAssessmentRecord } from "@/types/domain";

const initialState: PersonalizedProjectActionState = {};

const careerOptions = ["Engineering", "Healthcare", "Entrepreneurship", "Education", "Media"];
const entertainmentOptions = ["Gaming", "Sports", "Music", "Film", "Technology content"];
const workStyleOptions = ["Independent", "Small-group collaboration", "Hands-on building", "Research-heavy", "Presentation-driven"];
const industryOptions = ["Technology", "Business", "Public service", "Arts & design", "Science & sustainability"];

export function InterestAssessmentForm({ initialValue }: { initialValue: InterestAssessmentRecord | null }) {
  const [state, action] = useActionState(saveInterestAssessmentAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700">
        Career preference
        <select name="careerPreference" defaultValue={initialValue?.careerPreference ?? ""} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">Select a focus</option>
          {careerOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Entertainment preference
        <select
          name="entertainmentPreference"
          defaultValue={initialValue?.entertainmentPreference ?? ""}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="">Select a preference</option>
          {entertainmentOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Work style
        <select name="workStyle" defaultValue={initialValue?.workStyle ?? ""} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">Select a work style</option>
          {workStyleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Industry interest
        <select name="industryInterest" defaultValue={initialValue?.industryInterest ?? ""} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">Select an industry</option>
          {industryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      {state.error ? <p className="md:col-span-2 text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm text-emerald-700">{state.success}</p> : null}
      <div className="md:col-span-2">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Save interest profile
        </button>
      </div>
    </form>
  );
}
