"use client";

import { useActionState } from "react";

import { archiveProjectCatalogItemAction, type AdminActionState } from "@/lib/admin/actions";
import { getProjectCatalogDefinition } from "@/lib/project-catalog/catalog";
import type { ProjectCatalogItemRecord, ProjectCatalogType } from "@/types/domain";

const initialState: AdminActionState = {};

export function ProjectCatalogArchiveForm({
  catalogType,
  item
}: {
  catalogType: ProjectCatalogType;
  item: ProjectCatalogItemRecord;
}) {
  const [state, action] = useActionState(archiveProjectCatalogItemAction, initialState);
  const definition = getProjectCatalogDefinition(catalogType);

  if (item.status === "archived") {
    return <p className="text-sm text-slate-500">This {definition.singular} is already archived.</p>;
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="catalogType" value={catalogType} />
      <input type="hidden" name="itemId" value={item.id} />
      <button type="submit" className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
        Archive {definition.singular}
      </button>
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
