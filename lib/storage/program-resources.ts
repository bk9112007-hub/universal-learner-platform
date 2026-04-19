const DEFAULT_PROGRAM_RESOURCES_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_PROGRAM_RESOURCES ?? "program-resources";

export function getProgramResourcesBucket() {
  return DEFAULT_PROGRAM_RESOURCES_BUCKET;
}
