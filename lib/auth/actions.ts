"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getPostAuthDestination } from "@/lib/auth/post-auth";
import { getRoleRoute } from "@/lib/auth/roles";
import { claimPendingProgramAccessForEmail } from "@/lib/programs/access";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export type AuthFormState = {
  error?: string;
  success?: string;
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const signUpSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["student", "teacher", "parent", "admin"])
});

export async function loginAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { error: error?.message ?? "Unable to sign in right now." };
  }

  const claimed = await claimPendingProgramAccessForEmail({
    email: parsed.data.email,
    userId: data.user.id
  });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const role = (profile?.role as UserRole | undefined) ?? "student";
  const destination = await getPostAuthDestination({
    userId: data.user.id,
    role,
    claimedProgramSlugs: claimed.claimedProgramSlugs
  });

  redirect(destination || getRoleRoute(role));
}

export async function signUpAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return { error: "Please complete all fields with valid values." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`
    }
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: parsed.data.email.toLowerCase(),
      full_name: parsed.data.fullName,
      role: parsed.data.role
    });

    const claimed = await claimPendingProgramAccessForEmail({
      email: parsed.data.email,
      userId: data.user.id
    });

    if (data.session) {
      const destination = await getPostAuthDestination({
        userId: data.user.id,
        role: parsed.data.role,
        claimedProgramSlugs: claimed.claimedProgramSlugs
      });

      redirect(destination || getRoleRoute(parsed.data.role));
    }
  }

  return {
    success: "Account created. Check your email if confirmation is enabled, then sign in."
  };
}
