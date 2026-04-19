import Link from "next/link";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { SiteHeader } from "@/components/marketing/site-header";
import { getRoleRoute } from "@/lib/auth/roles";
import { getCurrentProfile } from "@/lib/supabase/queries";

export default async function SignUpPage() {
  const { profile, user } = await getCurrentProfile();

  if (user && profile?.role) {
    redirect(getRoleRoute(profile.role));
  }

  return (
    <div>
      <SiteHeader compact />
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:px-8">
        <section className="flex-1 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <h1 className="text-4xl font-semibold text-ink">Create your Universal Learner account.</h1>
          <p className="mt-4 max-w-xl text-slate-600">
            In the production flow, a server action creates the account, stores the role, and routes users to the correct workspace.
          </p>
        </section>
        <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
          <SignUpForm />
          <p className="mt-6 text-sm text-slate-600">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-brand-700">
              Login here
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
