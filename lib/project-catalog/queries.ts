import { createClient } from "@/lib/supabase/server";
import { getProjectCatalogDefinition, PROJECT_CATALOG_TYPES } from "@/lib/project-catalog/catalog";
import type {
  ProjectCatalogItemRecord,
  ProjectCatalogStatus,
  ProjectCatalogSummaryRecord,
  ProjectCatalogType,
  UserRole
} from "@/types/domain";

type CatalogRow = {
  id: string;
  title: string;
  summary: string;
  details: string;
  status: ProjectCatalogStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

async function fetchCatalogRows(type: ProjectCatalogType): Promise<CatalogRow[]> {
  const supabase = await createClient();
  const definition = getProjectCatalogDefinition(type);
  const { data, error } = await supabase
    .from(definition.table)
    .select("id, title, summary, details, status, created_at, updated_at, created_by, updated_by")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CatalogRow[];
}

function mapCatalogRow(type: ProjectCatalogType, row: CatalogRow): ProjectCatalogItemRecord {
  return {
    id: row.id,
    type,
    title: row.title,
    summary: row.summary,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by
  };
}

export async function getProjectCatalogItems(type: ProjectCatalogType): Promise<ProjectCatalogItemRecord[]> {
  const rows = await fetchCatalogRows(type);
  return rows.map((row) => mapCatalogRow(type, row));
}

export async function getProjectCatalogSummary(role: UserRole): Promise<ProjectCatalogSummaryRecord[]> {
  const rowsByType = await Promise.all(PROJECT_CATALOG_TYPES.map((type) => fetchCatalogRows(type)));

  return PROJECT_CATALOG_TYPES.map((type, index) => {
    const definition = getProjectCatalogDefinition(type);
    const rows = rowsByType[index];
    const draftCount = rows.filter((row) => row.status === "draft").length;
    const approvedCount = rows.filter((row) => row.status === "approved").length;
    const archivedCount = rows.filter((row) => row.status === "archived").length;

    return {
      type,
      title: definition.title,
      description: definition.description,
      href: `/app/admin/project-catalog/${type}`,
      totalCount: rows.length,
      draftCount,
      approvedCount,
      archivedCount,
      accessLabel: role === "admin" ? "Admin management access" : "Staff management access"
    };
  });
}
