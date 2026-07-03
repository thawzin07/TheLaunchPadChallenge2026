import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";

function configured(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  const started = Date.now();
  const user = await getCurrentUser().catch(() => null);
  let database = "ready";
  let databaseMessage = "Supabase Postgres connection ready";

  try {
    await ensureDatabase();
    await prisma.$queryRawUnsafe("select 1");
  } catch (error) {
    database = "failed";
    databaseMessage = error instanceof Error ? error.message : "Database check failed";
  }

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    services: [
      {
        key: "auth",
        label: "Private auth",
        status: user ? "ready" : "configured",
        message: user ? "Signed in with HttpOnly session cookies" : "Auth configured; sign in for private data checks",
      },
      {
        key: "database",
        label: "Database",
        status: database,
        message: databaseMessage,
      },
      {
        key: "supabase_storage",
        label: "Supabase Storage",
        status:
          configured(process.env.SUPABASE_URL) &&
          configured(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
          configured(process.env.SUPABASE_STORAGE_BUCKET)
            ? "configured"
            : "missing_config",
        message: configured(process.env.SUPABASE_STORAGE_BUCKET)
          ? `Bucket: ${process.env.SUPABASE_STORAGE_BUCKET}`
          : "Add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET",
      },
      {
        key: "ai_mock",
        label: "AI mock mode",
        status: (process.env.AI_MOCK_MODE ?? "true").toLowerCase() === "false" ? "configured" : "mocked",
        message:
          (process.env.AI_MOCK_MODE ?? "true").toLowerCase() === "false"
            ? "Real provider calls enabled"
            : "Deterministic provider active until keys are added",
      },
      {
        key: "openai",
        label: "OpenAI",
        status: configured(process.env.OPENAI_API_KEY) ? "configured" : "missing_config",
        message: configured(process.env.OPENAI_API_KEY) ? process.env.OPENAI_MODEL || "configured" : "Add OPENAI_API_KEY",
      },
      {
        key: "agnes",
        label: "Agnes AI",
        status: configured(process.env.AGNES_API_KEY) && configured(process.env.AGNES_API_BASE_URL) ? "configured" : "missing_config",
        message: "OpenAI-compatible adapter",
      },
      {
        key: "gmi",
        label: "GMI Cloud",
        status: configured(process.env.GMI_API_KEY) && configured(process.env.GMI_API_BASE_URL) ? "configured" : "missing_config",
        message: "OpenAI-compatible adapter",
      },
      {
        key: "mcf",
        label: "MyCareersFuture",
        status: "configured",
        message: "Public best-effort Singapore connector",
      },
      {
        key: "adzuna",
        label: "Adzuna SG",
        status: configured(process.env.ADZUNA_APP_ID) && configured(process.env.ADZUNA_APP_KEY) ? "configured" : "missing_config",
        message: "Add ADZUNA_APP_ID and ADZUNA_APP_KEY",
      },
      {
        key: "greenhouse",
        label: "Greenhouse",
        status: configured(process.env.GREENHOUSE_BOARD_TOKENS) ? "configured" : "missing_config",
        message: "Add comma-separated board tokens",
      },
      {
        key: "lever",
        label: "Lever",
        status: configured(process.env.LEVER_COMPANY_HANDLES) ? "configured" : "missing_config",
        message: "Add comma-separated company handles",
      },
    ],
  });
}
