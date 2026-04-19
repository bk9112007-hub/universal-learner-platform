"use client";

import { useActionState } from "react";

import { signUpAction, type AuthFormState } from "@/lib/auth/actions";

import { AuthSubmitButton } from "./auth-submit-button";

const initialState: AuthFormState = {};

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="fullName" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Full name" />
      <input name="email" type="email" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Email address" />
      <select name="role" defaultValue="student" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="parent">Parent</option>
        <option value="admin">Admin</option>
      </select>
      <input name="password" type="password" required minLength={8} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Password" />
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
      <AuthSubmitButton label="Create Account" pendingLabel="Creating account..." />
    </form>
  );
}
