"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { resolvePostAuthDestination, ensureProfileForUser } from "@/lib/auth/profile-repair";
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

const completeRoleSchema = z.object({
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

  const resolution = await resolvePostAuthDestination(data.user);
  redirect(resolution.destination);
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
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`
    }
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await ensureProfileForUser(data.user, {
      preferredRole: parsed.data.role
    });

    if (data.session) {
      const resolution = await resolvePostAuthDestination(data.user, {
        preferredRole: parsed.data.role
      });
      redirect(resolution.destination);
    }
  }

  return {
    success: "Account created. Check your email if confirmation is enabled, then sign in."
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function completeRoleAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = completeRoleSchema.safeParse({
    role: formData.get("role")
  });

  if (!parsed.success) {
    return { error: "Please choose a valid role to continue." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again to complete account setup." };
  }

  const resolution = await resolvePostAuthDestination(user, {
    preferredRole: parsed.data.role
  });

  redirect(resolution.destination);
}
