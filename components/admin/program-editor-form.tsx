"use client";

import { useActionState } from "react";

import { upsertProgramAction, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function ProgramEditorForm({
  program
}: {
  program?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    priceCents: number;
    shopifyProductId: string | null;
    isActive: boolean;
  };
}) {
  const [state, action] = useActionState(upsertProgramAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {program ? <input type="hidden" name="programId" value={program.id} /> : null}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
        <input
          name="title"
          required
          defaultValue={program?.title}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Program title"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Slug</label>
        <input
          name="slug"
          required
          defaultValue={program?.slug}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="program-slug"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
        <textarea
          name="description"
          required
          defaultValue={program?.description}
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="Describe the program and access outcome."
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Price (cents)</label>
        <input
          name="priceCents"
          type="number"
          min="0"
          required
          defaultValue={program?.priceCents ?? 0}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Shopify product id</label>
        <input
          name="shopifyProductId"
          defaultValue={program?.shopifyProductId ?? ""}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          placeholder="1234567890"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Visibility</label>
        <select
          name="isActive"
          defaultValue={program ? String(program.isActive) : "true"}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
        >
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
      </div>
      <div className="flex items-end">
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          {program ? "Save program" : "Create program"}
        </button>
      </div>
      {state.error ? <p className="md:col-span-2 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-2 text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
