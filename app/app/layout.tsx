import { redirect } from "next/navigation";

import { SupabaseAuthProvider } from "@/components/providers/supabase-auth-provider";
import { getCurrentProfile } from "@/lib/supabase/queries";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  return <SupabaseAuthProvider role={profile?.role ?? null}>{children}</SupabaseAuthProvider>;
}
