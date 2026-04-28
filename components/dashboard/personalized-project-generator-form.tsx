"use client";

import { useActionState } from "react";

import { generatePersonalizedProjectAction, type PersonalizedProjectActionState } from "@/lib/projects/personalization";

const initialState: PersonalizedProjectActionState = {};

export function PersonalizedProjectGeneratorForm({
  students,
  cohorts
}: {
  students: Array<{ id: string; fullName: string }>;
  cohorts: Array<{ id: string; title: string }>;
}) {
  const [state, action] = useActionState(generatePersonalizedProjectAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700">
        Target mode
        <select name="targetMode" defaultValue="student" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="student">Single student</option>
          <option value="cohort">Group / cohort</option>
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Student target
        <select name="studentId" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">Choose a learner</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Cohort target
        <select name="cohortId" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">Choose a cohort</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Group name
        <input name="groupName" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Future City Design Team" />
      </label>
      <label className="md:col-span-2 block text-sm font-semibold text-slate-700">
        Teacher priorities
        <textarea
          name="teacherPriorities"
          required
          className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Example: strengthen argumentative writing, evidence use, and applied math in a technology-forward project."
        />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Strengths to leverage
        <input name="focusStrengths" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Logic, presentation, collaboration" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Weaknesses to target
        <input name="focusWeaknesses" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Writing, reading, math" />
      </label>
      {state.error ? <p className="md:col-span-2 text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm text-emerald-700">{state.success}</p> : null}
      <div className="md:col-span-2">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Generate personalized project
        </button>
      </div>
    </form>
  );
}
