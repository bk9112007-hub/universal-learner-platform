"use client";

import { useActionState } from "react";

import { createAssessmentAction, type AssessmentActionState } from "@/lib/assessments/actions";

const initialState: AssessmentActionState = {};

export function AssessmentCreateForm({
  students
}: {
  students: Array<{ id: string; fullName: string }>;
}) {
  const [state, action] = useActionState(createAssessmentAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Assign to student</label>
        <select name="studentId" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Assessment title</label>
        <input name="title" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Science Lab Reflection" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
        <input name="subject" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Science" />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
        <textarea name="description" required className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Describe the task, evidence expected, and grading focus." />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Due date</label>
        <input name="dueDate" type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
      </div>
      <div className="flex items-end">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Create assessment
        </button>
      </div>
      {state.error ? <p className="md:col-span-2 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
