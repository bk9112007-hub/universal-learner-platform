"use client";

import { useActionState } from "react";

import { revokeEnrollmentAction, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function EnrollmentRevokeForm({ enrollmentId }: { enrollmentId: string }) {
  const [state, action] = useActionState(revokeEnrollmentAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <input
        name="revokeReason"
        required
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
        placeholder="Reason for revocation"
      />
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
        Revoke
      </button>
    </form>
  );
}
