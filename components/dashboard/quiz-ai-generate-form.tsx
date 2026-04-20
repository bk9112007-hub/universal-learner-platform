"use client";

import { useActionState, useState } from "react";

import { generateQuizWithAiAction, type AssessmentActionState } from "@/lib/assessments/actions";

const initialState: AssessmentActionState = {};

export function QuizAiGenerateForm({
  students,
  cohorts
}: {
  students: Array<{ id: string; fullName: string }>;
  cohorts: Array<{ id: string; title: string }>;
}) {
  const [state, action] = useActionState(generateQuizWithAiAction, initialState);
  const [targetType, setTargetType] = useState<"student" | "cohort">("student");

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Assign by</label>
        <select
          name="targetType"
          value={targetType}
          onChange={(event) => setTargetType(event.target.value as "student" | "cohort")}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="student">Student</option>
          <option value="cohort">Cohort</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">{targetType === "student" ? "Student" : "Cohort"}</label>
        <select name="targetId" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">{targetType === "student" ? "Select a student" : "Select a cohort"}</option>
          {(targetType === "student" ? students : cohorts).map((target) => (
            <option key={target.id} value={target.id}>
              {"fullName" in target ? target.fullName : target.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
        <input name="subject" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Science" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Topic</label>
        <input name="topic" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Forces and motion" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Difficulty</label>
        <select name="difficulty" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="foundational">Foundational</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Question count</label>
        <input name="questionCount" type="number" min="3" max="8" defaultValue="5" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Due date</label>
        <input name="dueDate" type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
      </div>
      <div className="flex items-end">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Generate quiz with AI
        </button>
      </div>
      {state.error ? <p className="md:col-span-2 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
