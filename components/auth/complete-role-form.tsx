"use client";

import { useActionState } from "react";

import { completeRoleAction, type AuthFormState } from "@/lib/auth/actions";

import { AuthSubmitButton } from "./auth-submit-button";

const initialState: AuthFormState = {};

export function CompleteRoleForm() {
  const [state, formAction] = useActionState(completeRoleAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <select name="role" defaultValue="student" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="parent">Parent</option>
        <option value="admin">Admin</option>
      </select>
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      <AuthSubmitButton label="Continue" pendingLabel="Saving role..." />
    </form>
  );
}
