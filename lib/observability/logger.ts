type LogLevel = "info" | "warn" | "error";

export function logEvent(level: LogLevel, scope: string, message: string, metadata?: Record<string, unknown>) {
  const payload = {
    level,
    scope,
    message,
    metadata: metadata ?? {},
    timestamp: new Date().toISOString()
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}
