"use client";

import { useActionState } from "react";

import { assignGeneratedProjectToStudentAction, type ProjectFormulatorActionState } from "@/lib/project-formulator/actions";

const initialState: ProjectFormulatorActionState = {};

export function GeneratedProjectAssignStudentForm({
  draftProjectId,
  students
}: {
  draftProjectId: string;
  students: Array<{ id: string; fullName: string }>;
}) {
  const [state, action] = useActionState(assignGeneratedProjectToStudentAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="draftProjectId" value={draftProjectId} />
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Assign to student</label>
        <select name="studentId" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
        Assign to Student
      </button>
      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
