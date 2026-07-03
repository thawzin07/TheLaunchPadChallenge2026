import { NextResponse } from "next/server";
import { z } from "zod";

import { withApiErrors } from "@/lib/api";
import { analyzeFit } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { stringifyJson } from "@/lib/json";
import { normalizeStoredJob } from "@/lib/jobs";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { serializeAnalysis } from "@/lib/serializers";
import type { NextRequest } from "next/server";

const analyzeSchema = z.object({
  jobId: z.string().min(1),
});

export const POST = withApiErrors(async (request: NextRequest) => {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const user = await requireUser();
  const input = analyzeSchema.parse(await request.json());
  await ensureDatabase();

  const job = await prisma.jobListing.findUnique({ where: { id: input.jobId } });
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const result = await analyzeFit(user.profile, normalizeStoredJob(job), user.id);
  const analysis = await prisma.fitAnalysis.create({
    data: {
      userId: user.id,
      jobListingId: job.id,
      overallScore: result.overallScore,
      confidence: result.confidence,
      summary: result.summary,
      matchedRequirementsJson: stringifyJson(result.matchedRequirements),
      missingRequirementsJson: stringifyJson(result.missingRequirements),
      evidenceMatchesJson: stringifyJson(result.evidenceMatches),
      risksJson: stringifyJson(result.risks),
      recommendationsJson: stringifyJson(result.recommendations),
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
    },
  });

  return NextResponse.json({ analysis: serializeAnalysis(analysis) });
});
