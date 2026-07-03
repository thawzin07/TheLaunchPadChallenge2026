import { NextResponse } from "next/server";
import { z } from "zod";

import { withApiErrors } from "@/lib/api";
import { analyzeFit, generateInterviewPrep } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { stringifyJson } from "@/lib/json";
import { normalizeStoredJob } from "@/lib/jobs";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { serializeAnalysis, serializeApplication, serializeInterview } from "@/lib/serializers";
import type { NextRequest } from "next/server";

const interviewSchema = z.object({
  applicationId: z.string().min(1),
});

export const GET = withApiErrors(async () => {
  const user = await requireUser();
  await ensureDatabase();

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      jobListing: true,
      fitAnalysis: true,
      applicationPack: true,
      interviewPrep: true,
    },
  });

  return NextResponse.json({ applications: applications.map(serializeApplication) });
});

export const POST = withApiErrors(async (request: NextRequest) => {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const user = await requireUser();
  const input = interviewSchema.parse(await request.json());
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
    const result = await analyzeFit(user.profile, normalizeStoredJob(application.jobListing), user.id);
    analysis = await prisma.fitAnalysis.create({
      data: {
        userId: user.id,
        jobListingId: application.jobListing.id,
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
    await prisma.application.update({
      where: { id: application.id },
      data: { fitAnalysisId: analysis.id },
    });
  }

  const result = await generateInterviewPrep(
    user.profile,
    normalizeStoredJob(application.jobListing),
    serializeAnalysis(analysis),
    user.id,
  );

  const interview = await prisma.interviewPrep.upsert({
    where: { applicationId: application.id },
    update: {
      questionsJson: stringifyJson(result.questions),
      answerGuidanceJson: stringifyJson(result.answerGuidance),
      gapQuestionsJson: stringifyJson(result.gapQuestions),
      technicalTopicsJson: stringifyJson(result.technicalTopics),
      behavioralStoriesJson: stringifyJson(result.behavioralStories),
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
    },
    create: {
      userId: user.id,
      applicationId: application.id,
      questionsJson: stringifyJson(result.questions),
      answerGuidanceJson: stringifyJson(result.answerGuidance),
      gapQuestionsJson: stringifyJson(result.gapQuestions),
      technicalTopicsJson: stringifyJson(result.technicalTopics),
      behavioralStoriesJson: stringifyJson(result.behavioralStories),
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
    },
  });

  return NextResponse.json({ interview: serializeInterview(interview), analysis: serializeAnalysis(analysis) });
});
