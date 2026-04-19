import Link from "next/link";
import { Download, FileText } from "lucide-react";

import type { SubmissionFileRecord } from "@/types/domain";

export function SubmissionFileList({
  files,
  emptyLabel = "No files attached."
}: {
  files: SubmissionFileRecord[];
  emptyLabel?: string;
}) {
  if (files.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{file.fileName}</p>
              <p className="text-xs text-slate-500">{file.mimeType ?? "Unknown file type"}</p>
            </div>
          </div>
          {file.downloadUrl ? (
            <Link
              href={file.downloadUrl}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-800"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Link>
          ) : (
            <span className="text-xs text-slate-400">Unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}
