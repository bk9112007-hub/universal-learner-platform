"use client";

import { useActionState } from "react";

import { assignLearnerAction, type ClassroomActionState } from "@/lib/classroom/actions";

const initialState: ClassroomActionState = {};

export function TeacherLearnerAssignForm({
  students,
  cohorts,
  helperText
}: {
  students: Array<{ id: string; fullName: string }>;
  cohorts: Array<{ id: string; title: string }>;
  helperText?: string;
}) {
  const [state, action] = useActionState(assignLearnerAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Learner</label>
        <select name="studentId" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">Select learner</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Cohort</label>
        <select name="cohortId" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">No cohort</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.title}
            </option>
          ))}
        </select>
      </div>
      {state.error ? <p className="md:col-span-2 text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm text-emerald-700">{state.success}</p> : null}
      <div className="md:col-span-2">
        {helperText ? <p className="mb-3 text-sm text-slate-500">{helperText}</p> : null}
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Assign learner
        </button>
      </div>
    </form>
  );
}
