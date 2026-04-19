export function formatDate(dateString: string | null) {
  if (!dateString) {
    return "No date";
  }

  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
