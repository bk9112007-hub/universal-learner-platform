import { redirect } from "next/navigation";

import { CompleteRoleForm } from "@/components/auth/complete-role-form";
import { SiteHeader } from "@/components/marketing/site-header";
import { ensureProfileForUser } from "@/lib/auth/profile-repair";
import { getRoleRoute } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function CompleteRolePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const repair = await ensureProfileForUser(user);
  if (!repair.needsRoleCompletion) {
    redirect(getRoleRoute(repair.profile.role));
  }

  return (
    <div>
      <SiteHeader compact />
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:px-8">
        <section className="flex-1 rounded-[2rem] bg-[linear-gradient(135deg,#0e2e63_0%,#2266d7_100%)] p-8 text-white shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-100">Complete setup</p>
          <h1 className="mt-4 text-4xl font-semibold">Choose how this account should behave inside Universal Learner.</h1>
          <p className="mt-4 max-w-xl text-blue-50">
            We repaired the missing profile record automatically. Select the intended role once so routing, assignments, parent links, and access control stay consistent everywhere.
          </p>
        </section>
        <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <CompleteRoleForm />
        </section>
      </main>
    </div>
  );
}
