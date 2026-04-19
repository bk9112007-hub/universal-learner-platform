import { type NextRequest, NextResponse } from "next/server";

import { getPostAuthDestination } from "@/lib/auth/post-auth";
import { getRoleRoute } from "@/lib/auth/roles";
import { claimPendingProgramAccessForEmail } from "@/lib/programs/access";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user && !next) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const role = (profile?.role as UserRole | undefined) ?? "student";
      const claimed = user.email
        ? await claimPendingProgramAccessForEmail({
            email: user.email,
            userId: user.id
          })
        : { claimedProgramSlugs: [] as string[] };

      next =
        (await getPostAuthDestination({
          userId: user.id,
          role,
          claimedProgramSlugs: claimed.claimedProgramSlugs
        })) ?? getRoleRoute(role);
    }
  }

  return NextResponse.redirect(new URL(next ?? "/app/student", request.url));
}
