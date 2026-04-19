import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_path, created_at")
    .eq("id", user.id)
    .single();

  return {
    user,
    profile: profile as { id: string; full_name: string | null; role: UserRole } | null
  };
}
