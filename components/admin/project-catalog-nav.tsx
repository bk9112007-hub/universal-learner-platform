import Link from "next/link";

import { getProjectCatalogDefinition, PROJECT_CATALOG_TYPES } from "@/lib/project-catalog/catalog";
import { cn } from "@/lib/utils";
import type { ProjectCatalogType } from "@/types/domain";

export function ProjectCatalogNav({ activeType }: { activeType?: ProjectCatalogType }) {
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href="/app/admin/project-catalog"
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold transition",
          activeType ? "border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700" : "bg-brand-700 text-white"
        )}
      >
        Overview
      </Link>
      {PROJECT_CATALOG_TYPES.map((type) => {
        const definition = getProjectCatalogDefinition(type);
        return (
          <Link
            key={type}
            href={`/app/admin/project-catalog/${type}`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              activeType === type ? "bg-brand-700 text-white" : "border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
            )}
          >
            {definition.title}
          </Link>
        );
      })}
    </nav>
  );
}
