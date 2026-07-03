import { NextResponse } from "next/server";
import { z } from "zod";

import { withApiErrors } from "@/lib/api";
import { analyzeFit, generateApplicationPack } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { stringifyJson } from "@/lib/json";
import { normalizeStoredJob } from "@/lib/jobs";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { serializeAnalysis, serializePack } from "@/lib/serializers";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { NextRequest } from "next/server";

const packSchema = z.object({
  applicationId: z.string().min(1),
});

async function latestResumeContext(userId: string) {
  const resume = await prisma.resumeFile.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!resume) return {};

  const context: {
    latestResumeFileName: string;
    latestResumeText?: string;
    resumeFile?: {
      fileName: string;
      contentType: string;
      base64: string;
    };
  } = {
    latestResumeFileName: resume.fileName,
    latestResumeText: resume.extractedText || undefined,
  };

  if (!resume.extractedText) {
    const download = await getSupabaseAdmin().storage.from(resume.bucket).download(resume.path);
    if (download.data && !download.error) {
      const buffer = Buffer.from(await download.data.arrayBuffer());
      context.resumeFile = {
        fileName: resume.fileName,
        contentType: resume.contentType || "application/octet-stream",
        base64: buffer.toString("base64"),
      };
    }
  }

  return context;
}

export const POST = withApiErrors(async (request: NextRequest) => {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const user = await requireUser();
  const input = packSchema.parse(await request.json());
  await ensureDatabase();

  const application = await prisma.application.findFirst({
    where: { id: input.applicationId, userId: user.id },
    include: {
      jobListing: true,
      fitAnalysis: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  let analysis = application.fitAnalysis;
  if (!analysis) {
    const analysisResult = await analyzeFit(user.profile, normalizeStoredJob(application.jobListing), user.id);
    analysis = await prisma.fitAnalysis.create({
      data: {
        userId: user.id,
        jobListingId: application.jobListing.id,
        overallScore: analysisResult.overallScore,
        confidence: analysisResult.confidence,
        summary: analysisResult.summary,
        matchedRequirementsJson: stringifyJson(analysisResult.matchedRequirements),
        missingRequirementsJson: stringifyJson(analysisResult.missingRequirements),
        evidenceMatchesJson: stringifyJson(analysisResult.evidenceMatches),
        risksJson: stringifyJson(analysisResult.risks),
        recommendationsJson: stringifyJson(analysisResult.recommendations),
        provider: analysisResult.provider,
        model: analysisResult.model,
        latencyMs: analysisResult.latencyMs,
      },
    });
    await prisma.application.update({
      where: { id: application.id },
      data: { fitAnalysisId: analysis.id },
    });
  }

  const result = await generateApplicationPack(
    user.profile,
    normalizeStoredJob(application.jobListing),
    serializeAnalysis(analysis),
    user.id,
    await latestResumeContext(user.id),
  );

  const pack = await prisma.applicationPack.upsert({
    where: { applicationId: application.id },
    update: {
      resumeBulletsJson: stringifyJson(result.resumeBullets),
      resumeDraft: result.resumeDraft,
      coverLetter: result.coverLetter,
      recruiterMessage: result.recruiterMessage,
      keywordsJson: stringifyJson(result.keywords),
      claimsToAvoidJson: stringifyJson(result.claimsToAvoid),
      evidenceLinksJson: stringifyJson(result.evidenceLinks),
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
    },
    create: {
      userId: user.id,
      applicationId: application.id,
      resumeBulletsJson: stringifyJson(result.resumeBullets),
      resumeDraft: result.resumeDraft,
      coverLetter: result.coverLetter,
      recruiterMessage: result.recruiterMessage,
      keywordsJson: stringifyJson(result.keywords),
      claimsToAvoidJson: stringifyJson(result.claimsToAvoid),
      evidenceLinksJson: stringifyJson(result.evidenceLinks),
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
    },
  });

  return NextResponse.json({ pack: serializePack(pack), analysis: serializeAnalysis(analysis) });
});
