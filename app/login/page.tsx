import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { SiteHeader } from "@/components/marketing/site-header";
import { getRoleRoute } from "@/lib/auth/roles";
import { getCurrentProfile } from "@/lib/supabase/queries";

export default async function LoginPage() {
  const { profile, user } = await getCurrentProfile();

  if (user && (!profile || profile.role_source === "fallback")) {
    redirect("/complete-role");
  }

  if (user && profile?.role) {
    redirect(getRoleRoute(profile.role));
  }

  return (
    <div>
      <SiteHeader compact />
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:px-8">
        <section className="flex-1 rounded-[2rem] bg-[linear-gradient(135deg,#0e2e63_0%,#2266d7_100%)] p-8 text-white shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-100">Authentication</p>
          <h1 className="mt-4 text-4xl font-semibold">Login for students, teachers, parents, and admins.</h1>
          <p className="mt-4 max-w-xl text-blue-50">
            Supabase Auth handles secure email and password flows now, with room for magic links and OAuth later.
          </p>
        </section>
        <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <LoginForm />
          <p className="mt-6 text-sm text-slate-600">
            Need an account?{" "}
            <Link href="/sign-up" className="font-semibold text-brand-700">
              Create one here
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
