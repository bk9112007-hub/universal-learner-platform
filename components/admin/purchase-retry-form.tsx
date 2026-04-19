"use client";

import { useActionState } from "react";

import { retryPurchaseProcessingAction, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function PurchaseRetryForm({ purchaseId }: { purchaseId: string }) {
  const [state, action] = useActionState(retryPurchaseProcessingAction, initialState);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="purchaseId" value={purchaseId} />
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
      <button type="submit" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-800">
        Retry processing
      </button>
    </form>
  );
}
