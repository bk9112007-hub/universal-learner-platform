"use client";

import { useActionState } from "react";

import { assignPendingAccessAction, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function PendingAccessAssignForm({
  pendingId,
  users
}: {
  pendingId: string;
  users: Array<{ id: string; fullName: string; role: string }>;
}) {
  const [state, action] = useActionState(assignPendingAccessAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="pendingId" value={pendingId} />
      <select name="targetUserId" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500">
        <option value="">Assign to user</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.fullName} ({user.role})
          </option>
        ))}
      </select>
      <input
        name="resolutionNote"
        required
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
        placeholder="Assigned to intended child account"
      />
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800">
        Assign access
      </button>
    </form>
  );
}
