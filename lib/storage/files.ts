const DEFAULT_SUBMISSIONS_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_SUBMISSIONS ?? "submissions";

export function getSubmissionBucket() {
  return DEFAULT_SUBMISSIONS_BUCKET;
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-").replace(/-+/g, "-");
}
