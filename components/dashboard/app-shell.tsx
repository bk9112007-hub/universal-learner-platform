import Link from "next/link";
import { BookOpenCheck, ChartColumn, FolderKanban, House, MessagesSquare, ShieldCheck, Users } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

const navItems = {
  student: [
    { href: "/app/student", label: "Dashboard", icon: House },
    { href: "/app/programs", label: "Programs", icon: ShieldCheck },
    { href: "/app/projects", label: "Projects", icon: FolderKanban },
    { href: "/app/student#assessments", label: "Assessments", icon: BookOpenCheck },
    { href: "/app/student#feedback", label: "Feedback", icon: MessagesSquare }
  ],
  teacher: [
    { href: "/app/teacher", label: "Dashboard", icon: House },
    { href: "/app/programs", label: "Programs", icon: ShieldCheck },
    { href: "/app/teacher#classes", label: "Classes", icon: Users },
    { href: "/app/teacher#projects", label: "Projects", icon: FolderKanban },
    { href: "/app/teacher#grading", label: "Grading", icon: ChartColumn },
    { href: "/app/admin/project-catalog", label: "Catalog", icon: BookOpenCheck },
    { href: "/app/admin/project-formulator", label: "Formulator", icon: MessagesSquare }
  ],
  parent: [
    { href: "/app/parent", label: "Overview", icon: House },
    { href: "/app/programs", label: "Programs", icon: ShieldCheck },
    { href: "/app/parent#progress", label: "Progress", icon: ChartColumn },
    { href: "/app/parent#programs", label: "Programs", icon: BookOpenCheck },
    { href: "/app/parent#consultations", label: "Consultations", icon: MessagesSquare }
  ],
  admin: [
    { href: "/app/admin", label: "Overview", icon: House },
    { href: "/app/admin/project-catalog", label: "Catalog", icon: BookOpenCheck },
    { href: "/app/admin/project-formulator", label: "Formulator", icon: MessagesSquare },
    { href: "/app/programs", label: "Programs", icon: ShieldCheck },
    { href: "/app/admin#users", label: "Users", icon: Users },
    { href: "/app/admin#analytics", label: "Analytics", icon: ChartColumn },
    { href: "/app/admin#programs", label: "Programs", icon: FolderKanban }
  ]
} satisfies Record<UserRole, Array<{ href: string; label: string; icon: typeof House }>>;

export function AppShell({
  role,
  title,
  description,
  children,
  unreadNotificationCount = 0
}: {
  role: UserRole;
  title: string;
  description: string;
  children: React.ReactNode;
  unreadNotificationCount?: number;
}) {
  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="w-full rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
          <div className="rounded-3xl bg-brand-700 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">Universal Learner</p>
            <h2 className="mt-3 text-2xl font-semibold capitalize">{role} workspace</h2>
            <p className="mt-2 text-sm text-blue-50">Role-aware dashboards powered by Supabase auth and secure permissions.</p>
            <p className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              {unreadNotificationCount} unread notification{unreadNotificationCount === 1 ? "" : "s"}
            </p>
          </div>
          <nav className="mt-6 space-y-2">
            {navItems[role].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-800")}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 border-t border-slate-200 pt-4 lg:hidden">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Account</p>
            <SignOutButton fullWidth />
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">Authenticated App</p>
                <h1 className="mt-3 text-4xl font-semibold text-ink">{title}</h1>
                <p className="mt-3 max-w-3xl text-slate-600">{description}</p>
              </div>
              <div className="hidden items-center gap-4 lg:flex">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Profile</p>
                  <p className="mt-2 text-sm font-semibold text-ink capitalize">{role} account</p>
                  <p className="mt-1 text-xs text-slate-500">{unreadNotificationCount} unread notification{unreadNotificationCount === 1 ? "" : "s"}</p>
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
