"use client";

import { useActionState } from "react";

import { loginAction, type AuthFormState } from "@/lib/auth/actions";

import { AuthSubmitButton } from "./auth-submit-button";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="email" type="email" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Email address" />
      <input name="password" type="password" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Password" />
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      <AuthSubmitButton label="Sign In" pendingLabel="Signing in..." />
    </form>
  );
}
