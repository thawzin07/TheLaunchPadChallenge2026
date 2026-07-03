import type {
  Application,
  ApplicationPack,
  FitAnalysis,
  InterviewPrep,
  JobListing,
} from "@prisma/client";

import { parseJson } from "@/lib/json";
import { normalizeStoredJob } from "@/lib/jobs";
import type {
  ApplicationPackResult,
  EvidenceMatch,
  FitAnalysisResult,
  InterviewPrepResult,
  RequirementMatch,
} from "@/lib/types";

export function serializeAnalysis(analysis: FitAnalysis): FitAnalysisResult & { id: string; createdAt: string } {
  return {
    id: analysis.id,
    overallScore: analysis.overallScore,
    confidence: analysis.confidence as FitAnalysisResult["confidence"],
    summary: analysis.summary,
    matchedRequirements: parseJson<RequirementMatch[]>(analysis.matchedRequirementsJson, []),
    missingRequirements: parseJson<string[]>(analysis.missingRequirementsJson, []),
    evidenceMatches: parseJson<EvidenceMatch[]>(analysis.evidenceMatchesJson, []),
    risks: parseJson<string[]>(analysis.risksJson, []),
    recommendations: parseJson<string[]>(analysis.recommendationsJson, []),
    provider: analysis.provider,
    model: analysis.model,
    latencyMs: analysis.latencyMs,
    createdAt: analysis.createdAt.toISOString(),
  };
}

export function serializePack(pack: ApplicationPack): ApplicationPackResult & { id: string; createdAt: string } {
  return {
    id: pack.id,
    resumeBullets: parseJson<string[]>(pack.resumeBulletsJson, []),
    resumeDraft: pack.resumeDraft,
    coverLetter: pack.coverLetter,
    recruiterMessage: pack.recruiterMessage,
    keywords: parseJson<string[]>(pack.keywordsJson, []),
    claimsToAvoid: parseJson<string[]>(pack.claimsToAvoidJson, []),
    evidenceLinks: parseJson<EvidenceMatch[]>(pack.evidenceLinksJson, []),
    provider: pack.provider,
    model: pack.model,
    latencyMs: pack.latencyMs,
    createdAt: pack.createdAt.toISOString(),
  };
}

export function serializeInterview(interview: InterviewPrep): InterviewPrepResult & { id: string; createdAt: string } {
  return {
    id: interview.id,
    questions: parseJson<string[]>(interview.questionsJson, []),
    answerGuidance: parseJson<string[]>(interview.answerGuidanceJson, []),
    gapQuestions: parseJson<string[]>(interview.gapQuestionsJson, []),
    technicalTopics: parseJson<string[]>(interview.technicalTopicsJson, []),
    behavioralStories: parseJson<string[]>(interview.behavioralStoriesJson, []),
    provider: interview.provider,
    model: interview.model,
    latencyMs: interview.latencyMs,
    createdAt: interview.createdAt.toISOString(),
  };
}

export function serializeApplication(
  application: Application & {
    jobListing: JobListing;
    fitAnalysis?: FitAnalysis | null;
    applicationPack?: ApplicationPack | null;
    interviewPrep?: InterviewPrep | null;
  },
) {
  return {
    id: application.id,
    status: application.status,
    sourceUrl: application.sourceUrl,
    appliedAt: application.appliedAt?.toISOString() ?? null,
    followUpAt: application.followUpAt?.toISOString() ?? null,
    interviewAt: application.interviewAt?.toISOString() ?? null,
    notes: application.notes,
    outcome: application.outcome,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    job: normalizeStoredJob(application.jobListing),
    analysis: application.fitAnalysis ? serializeAnalysis(application.fitAnalysis) : null,
    pack: application.applicationPack ? serializePack(application.applicationPack) : null,
    interview: application.interviewPrep ? serializeInterview(application.interviewPrep) : null,
  };
}
