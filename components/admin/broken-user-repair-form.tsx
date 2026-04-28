"use client";

import { useActionState } from "react";

import { repairUserProfileAction, type AdminActionState } from "@/lib/admin/actions";
import type { BrokenUserRecord } from "@/types/domain";

const initialState: AdminActionState = {};

export function BrokenUserRepairForm({ user }: { user: BrokenUserRecord }) {
  const [state, action] = useActionState(repairUserProfileAction, initialState);

  return (
    <form action={action} className="space-y-4 rounded-[1.5rem] border border-slate-200 p-4">
      <input type="hidden" name="userId" value={user.id} />
      <div>
        <p className="text-sm font-semibold text-ink">{user.fullName}</p>
        <p className="mt-1 text-xs text-slate-500">
          {user.email ?? "No email"} | auth role {user.authRole ?? "missing"} | profile role {user.profileRole ?? "missing"}
        </p>
      </div>
      <label className="block text-sm font-semibold text-slate-700">
        Repair role
        <select
          name="role"
          defaultValue={user.authRole ?? user.profileRole ?? "student"}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="parent">Parent</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button type="submit" className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">
        Repair user
      </button>
    </form>
  );
}
