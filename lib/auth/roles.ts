import { redirect } from "next/navigation";

import { appRouteByRole } from "@/lib/content/site-content";
import type { UserRole } from "@/types/domain";

export function getRoleRoute(role: UserRole) {
  return appRouteByRole[role];
}

export function assertRole(allowed: UserRole[], current: UserRole | null) {
  if (!current || !allowed.includes(current)) {
    redirect("/login");
  }
}
