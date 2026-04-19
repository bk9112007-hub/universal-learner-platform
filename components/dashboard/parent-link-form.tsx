"use client";

import { useActionState } from "react";

import { linkChildToParentAction, type ParentLinkActionState } from "@/lib/parents/actions";

const initialState: ParentLinkActionState = {};

export function ParentLinkForm() {
  const [state, action] = useActionState(linkChildToParentAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-[1fr,auto]">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Child account email</label>
        <input
          name="childEmail"
          type="email"
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="student@example.com"
        />
      </div>
      <div className="flex items-end">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Link child
        </button>
      </div>
      {state.error ? <p className="md:col-span-2 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
