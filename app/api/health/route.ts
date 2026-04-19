import { NextResponse } from "next/server";

import { getDeploymentReadiness } from "@/lib/config/readiness";

export async function GET() {
  const readiness = getDeploymentReadiness();

  return NextResponse.json(
    {
      ok: readiness.status === "ready",
      status: readiness.status,
      timestamp: new Date().toISOString(),
      missingRequired: readiness.missingRequired.map((check) => ({
        key: check.key,
        label: check.label
      })),
      features: readiness.features
    },
    { status: readiness.status === "ready" ? 200 : 503 }
  );
}
