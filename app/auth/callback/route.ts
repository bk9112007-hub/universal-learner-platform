import { type NextRequest, NextResponse } from "next/server";

import { resolvePostAuthDestination } from "@/lib/auth/profile-repair";
import { createClient } from "@/lib/supabase/server";

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
      const resolution = await resolvePostAuthDestination(user);
      next = resolution.destination;
    }
  }

  return NextResponse.redirect(new URL(next ?? "/app/student", request.url));
}
