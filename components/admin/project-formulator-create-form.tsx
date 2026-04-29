"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createGeneratedProjectDraftAction, type ProjectFormulatorActionState } from "@/lib/project-formulator/actions";
import type { ProjectCatalogItemRecord } from "@/types/domain";

const initialState: ProjectFormulatorActionState = {};

export function ProjectFormulatorCreateForm({
  options
}: {
  options: {
    hooks: ProjectCatalogItemRecord[];
    roles: ProjectCatalogItemRecord[];
    scenarios: ProjectCatalogItemRecord[];
    activities: ProjectCatalogItemRecord[];
    outputs: ProjectCatalogItemRecord[];
  };
}) {
  const [state, action] = useActionState(createGeneratedProjectDraftAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [router, state.redirectTo]);

  const selectors = [
    { key: "hooks" as const, field: "hookId", label: "Hook" },
    { key: "roles" as const, field: "roleId", label: "Role" },
    { key: "scenarios" as const, field: "scenarioId", label: "Scenario" },
    { key: "activities" as const, field: "activityId", label: "Activity" },
    { key: "outputs" as const, field: "outputId", label: "Output" }
  ];

  return (
    <form action={action} className="grid gap-4 xl:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
        <input name="subject" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Interdisciplinary, Science, History..." />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Skill goal</label>
        <input name="skillGoal" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Analytical writing, proportional reasoning..." />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Grade band</label>
        <input name="gradeBand" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Grades 4-5, Middle school..." />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Difficulty</label>
        <select name="difficulty" defaultValue="Intermediate" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option>Foundational</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Duration</label>
        <select name="duration" defaultValue="2 weeks" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option>1 week</option>
          <option>2 weeks</option>
          <option>3 weeks</option>
          <option>4+ weeks</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Student interests</label>
        <input name="studentInterests" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Gaming, marine biology, entrepreneurship" />
      </div>
      {selectors.map((selector) => (
        <div key={selector.key}>
          <label className="mb-2 block text-sm font-semibold text-slate-700">{selector.label}</label>
          <select name={selector.field} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" defaultValue={options[selector.key][0]?.id}>
            {options[selector.key].map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="xl:col-span-2 flex flex-wrap items-center gap-4">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Create draft project
        </button>
        <p className="text-sm text-slate-500">This human-only version builds a usable draft immediately from the selected catalog ingredients.</p>
      </div>
      {state.error ? <p className="xl:col-span-2 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="xl:col-span-2 text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
