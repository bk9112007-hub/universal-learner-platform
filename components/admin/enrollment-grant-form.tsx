"use client";

import { useActionState } from "react";

import { grantEnrollmentAction, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function EnrollmentGrantForm({
  programs,
  users
}: {
  programs: Array<{ id: string; title: string }>;
  users: Array<{ id: string; fullName: string; role: string }>;
}) {
  const [state, action] = useActionState(grantEnrollmentAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Program</label>
        <select name="programId" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">Select program</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">User</label>
        <select name="userId" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          <option value="">Select user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName} ({user.role})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Reason</label>
        <input
          name="accessReason"
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Manual grant for support case"
        />
      </div>
      <div className="md:col-span-3">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Grant enrollment
        </button>
      </div>
      {state.error ? <p className="md:col-span-3 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-3 text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
