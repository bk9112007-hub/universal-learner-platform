import type { ProjectCatalogType } from "@/types/domain";

export const PROJECT_CATALOG_TYPES = ["hooks", "roles", "scenarios", "activities", "outputs"] as const;

export const PROJECT_CATALOG_DEFINITIONS = {
  hooks: {
    type: "hooks",
    singular: "hook",
    title: "Hooks",
    description: "Compelling openings that make a project feel immediate, meaningful, and worth solving.",
    table: "project_hooks"
  },
  roles: {
    type: "roles",
    singular: "role",
    title: "Roles",
    description: "Real-world identities students can step into so the work feels purposeful and authentic.",
    table: "project_roles"
  },
  scenarios: {
    type: "scenarios",
    singular: "scenario",
    title: "Scenarios",
    description: "Rich contexts that create urgency, constraints, and a reason for students to apply knowledge.",
    table: "project_scenarios"
  },
  activities: {
    type: "activities",
    singular: "activity",
    title: "Activities",
    description: "Meaningful actions learners take during a project, from research to testing to presentation.",
    table: "project_activities"
  },
  outputs: {
    type: "outputs",
    singular: "output",
    title: "Outputs",
    description: "Concrete final products that show what the learner created, explained, or delivered.",
    table: "project_outputs"
  }
} satisfies Record<
  ProjectCatalogType,
  {
    type: ProjectCatalogType;
    singular: string;
    title: string;
    description: string;
    table: "project_hooks" | "project_roles" | "project_scenarios" | "project_activities" | "project_outputs";
  }
>;

export function isProjectCatalogType(value: string): value is ProjectCatalogType {
  return (PROJECT_CATALOG_TYPES as readonly string[]).includes(value);
}

export function getProjectCatalogDefinition(type: ProjectCatalogType) {
  return PROJECT_CATALOG_DEFINITIONS[type];
}
