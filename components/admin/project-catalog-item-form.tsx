"use client";

import { useActionState } from "react";

import { type AdminActionState, upsertProjectCatalogItemAction } from "@/lib/admin/actions";
import { getProjectCatalogDefinition } from "@/lib/project-catalog/catalog";
import type { ProjectCatalogItemRecord, ProjectCatalogType } from "@/types/domain";

const initialState: AdminActionState = {};

export function ProjectCatalogItemForm({
  catalogType,
  item
}: {
  catalogType: ProjectCatalogType;
  item?: ProjectCatalogItemRecord;
}) {
  const [state, action] = useActionState(upsertProjectCatalogItemAction, initialState);
  const definition = getProjectCatalogDefinition(catalogType);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="catalogType" value={catalogType} />
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">{definition.singular[0].toUpperCase() + definition.singular.slice(1)} title</label>
        <input
          name="title"
          required
          defaultValue={item?.title}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder={`Enter a strong ${definition.singular} title`}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Summary</label>
        <textarea
          name="summary"
          required
          defaultValue={item?.summary}
          className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder={`Write the short version of how this ${definition.singular} should be used.`}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Details</label>
        <textarea
          name="details"
          required
          defaultValue={item?.details}
          className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder={`Describe how this ${definition.singular} should shape a usable project experience.`}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-[0.7fr,1fr] md:items-end">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
          <select
            name="status"
            defaultValue={item?.status ?? "draft"}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          >
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          {item ? `Save ${definition.singular}` : `Create ${definition.singular}`}
        </button>
      </div>
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
