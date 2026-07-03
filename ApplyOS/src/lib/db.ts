import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  databaseReady?: Promise<void>;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function ensureDatabase() {
  if (!globalForPrisma.databaseReady) {
    globalForPrisma.databaseReady = (async () => {
      await prisma.$queryRawUnsafe("select 1");
    })();
  }

  return globalForPrisma.databaseReady;
}

export async function recordApiRun(input: {
  userId?: string;
  type: string;
  provider: string;
  modelOrEndpoint: string;
  status: "ok" | "failed" | "mocked" | "skipped";
  latencyMs: number;
  errorMessage?: string;
}) {
  try {
    await ensureDatabase();
    await prisma.apiRun.create({
      data: {
        userId: input.userId,
        type: input.type,
        provider: input.provider,
        modelOrEndpoint: input.modelOrEndpoint,
        status: input.status,
        latencyMs: input.latencyMs,
        errorMessage: input.errorMessage ?? "",
      },
    });
  } catch {
    // Observability should never block the user path.
  }
}
