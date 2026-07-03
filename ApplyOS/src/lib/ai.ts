import { recordApiRun } from "@/lib/db";
import {
  buildApplicationPack,
  buildFitAnalysis,
  buildInterviewPrep,
} from "@/lib/scoring";
import type {
  ApplicationPackResult,
  FitAnalysisResult,
  InterviewPrepResult,
  NormalizedJob,
  ParsedProfile,
} from "@/lib/types";

type AiTask = "fit_analysis" | "application_pack" | "interview_prep";
type UnknownRecord = Record<string, unknown>;
type ResumeFileInput = {
  fileName: string;
  contentType: string;
  base64: string;
};

function mockMode() {
  return (process.env.AI_MOCK_MODE ?? "true").toLowerCase() !== "false";
}

function timeoutMs() {
  return Number.parseInt(process.env.AI_TIMEOUT_MS || "60000", 10);
}

function extractResponseText(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = Array.isArray(record.output) ? record.output : [];
  return output
    .flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];
      const content = (item as Record<string, unknown>).content;
      return Array.isArray(content) ? content : [];
    })
    .map((content) => {
      if (typeof content !== "object" || content === null) return "";
      const recordContent = content as Record<string, unknown>;
      return typeof recordContent.text === "string" ? recordContent.text : "";
    })
    .join("");
}

function parseJsonPayload<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.map((item) => stringValue(item)).filter(Boolean)
    : fallback;
}

function safeStatus(value: unknown): "strong" | "partial" | "gap" | "unsupported" | "review" {
  return value === "strong" || value === "partial" || value === "gap" || value === "unsupported" || value === "review"
    ? value
    : "review";
}

function safeEvidenceMatches(value: unknown, fallback: FitAnalysisResult["evidenceMatches"]) {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter(isRecord)
    .map((item) => ({
      claim: stringValue(item.claim, "Review this claim before using it."),
      evidence: stringValue(item.evidence, "No evidence supplied."),
      status: safeStatus(item.status),
    }))
    .slice(0, 20);
}

function safeRequirementMatches(value: unknown, fallback: FitAnalysisResult["matchedRequirements"]) {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter(isRecord)
    .map((item) => ({
      requirement: stringValue(item.requirement, "Unspecified requirement"),
      status: safeStatus(item.status),
      evidence: stringValue(item.evidence, "No evidence supplied."),
    }))
    .slice(0, 20);
}

function sanitizeFitResult(value: unknown, fallback: FitAnalysisResult): FitAnalysisResult {
  if (!isRecord(value)) return fallback;

  return {
    ...fallback,
    overallScore: Math.max(0, Math.min(100, Math.round(numberValue(value.overallScore, fallback.overallScore)))),
    confidence:
      value.confidence === "low" || value.confidence === "medium" || value.confidence === "high"
        ? value.confidence
        : fallback.confidence,
    summary: stringValue(value.summary, fallback.summary),
    matchedRequirements: safeRequirementMatches(value.matchedRequirements, fallback.matchedRequirements),
    missingRequirements: stringArray(value.missingRequirements, fallback.missingRequirements),
    evidenceMatches: safeEvidenceMatches(value.evidenceMatches, fallback.evidenceMatches),
    risks: stringArray(value.risks, fallback.risks),
    recommendations: stringArray(value.recommendations, fallback.recommendations),
  };
}

function sanitizeApplicationPack(value: unknown, fallback: ApplicationPackResult): ApplicationPackResult {
  if (!isRecord(value)) return fallback;

  return {
    ...fallback,
    resumeBullets: stringArray(value.resumeBullets, fallback.resumeBullets).slice(0, 12),
    resumeDraft: stringValue(value.resumeDraft, fallback.resumeDraft),
    coverLetter: stringValue(value.coverLetter, fallback.coverLetter),
    recruiterMessage: stringValue(value.recruiterMessage, fallback.recruiterMessage),
    keywords: stringArray(value.keywords, fallback.keywords).slice(0, 24),
    claimsToAvoid: stringArray(value.claimsToAvoid, fallback.claimsToAvoid).slice(0, 12),
    evidenceLinks: safeEvidenceMatches(value.evidenceLinks, fallback.evidenceLinks),
  };
}

function sanitizeInterviewPrep(value: unknown, fallback: InterviewPrepResult): InterviewPrepResult {
  if (!isRecord(value)) return fallback;

  return {
    ...fallback,
    questions: stringArray(value.questions, fallback.questions).slice(0, 16),
    answerGuidance: stringArray(value.answerGuidance, fallback.answerGuidance).slice(0, 16),
    gapQuestions: stringArray(value.gapQuestions, fallback.gapQuestions).slice(0, 12),
    technicalTopics: stringArray(value.technicalTopics, fallback.technicalTopics).slice(0, 16),
    behavioralStories: stringArray(value.behavioralStories, fallback.behavioralStories).slice(0, 12),
  };
}

function resumeFileFromExtra(extra: unknown): ResumeFileInput | null {
  if (!isRecord(extra) || !isRecord(extra.resumeFile)) return null;
  const resumeFile = extra.resumeFile;
  const fileName = stringValue(resumeFile.fileName);
  const contentType = stringValue(resumeFile.contentType, "application/octet-stream");
  const base64 = stringValue(resumeFile.base64);

  if (!fileName || !base64) return null;
  return { fileName, contentType, base64 };
}

function extraForPrompt(extra: unknown) {
  if (!isRecord(extra) || !isRecord(extra.resumeFile)) return extra;
  const { resumeFile, ...rest } = extra;
  const fileName = stringValue(resumeFile.fileName);
  const contentType = stringValue(resumeFile.contentType, "application/octet-stream");

  return {
    ...rest,
    resumeFile: fileName
      ? {
          fileName,
          contentType,
          includedAsOpenAIFileInput: true,
        }
      : undefined,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs());

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function systemPrompt(task: AiTask) {
  const schemas = {
    fit_analysis:
      "Return keys: overallScore number 0-100, confidence low|medium|high, summary string, matchedRequirements array of {requirement,status,evidence}, missingRequirements string[], evidenceMatches array of {claim,evidence,status}, risks string[], recommendations string[].",
    application_pack:
      "Return keys: resumeBullets string[], resumeDraft string, coverLetter string, recruiterMessage string, keywords string[], claimsToAvoid string[], evidenceLinks array of {claim,evidence,status}. The resumeDraft must be a tailored version of the applicant's existing resume/profile for this job description.",
    interview_prep:
      "Return keys: questions string[], answerGuidance string[], gapQuestions string[], technicalTopics string[], behavioralStories string[].",
  } satisfies Record<AiTask, string>;

  return `You are ApplyOS, a career copilot for Singapore students and fresh graduates. Return strict JSON only. Never invent employers, degrees, certifications, dates, links, or hard metrics. For resume tailoring, improve ordering, phrasing, keywords, and emphasis from the existing resume/profile even when evidence matching is incomplete. ${schemas[task]} Task: ${task}.`;
}

function inputPayload(task: AiTask, profile: ParsedProfile, job: NormalizedJob, extra?: unknown) {
  const instructions = {
    fit_analysis:
      "Use profile evidence to explain fit, gaps, and risk. Mark unsupported claims clearly.",
    application_pack:
      "Tailor the existing resume/profile to the job description. Do not require perfect evidence links before producing useful resume bullets or a resume draft. Keep claims plausible from the supplied resume/profile and avoid fabricating employers, education, certifications, dates, links, or exact metrics.",
    interview_prep:
      "Generate role-specific interview preparation from the profile and job. Keep weak areas honest and useful.",
  } satisfies Record<AiTask, string>;

  return JSON.stringify(
    {
      profile,
      job,
      extra: extraForPrompt(extra),
      instruction: instructions[task],
    },
    null,
    2,
  );
}

function openAiUserContent(task: AiTask, profile: ParsedProfile, job: NormalizedJob, extra?: unknown) {
  const payload = inputPayload(task, profile, job, extra);
  const resumeFile = task === "application_pack" ? resumeFileFromExtra(extra) : null;

  if (!resumeFile) return payload;

  return [
    {
      type: "input_file",
      filename: resumeFile.fileName,
      file_data: `data:${resumeFile.contentType};base64,${resumeFile.base64}`,
    },
    {
      type: "input_text",
      text: payload,
    },
  ];
}

async function callOpenAI<T>(task: AiTask, profile: ParsedProfile, job: NormalizedJob, extra?: unknown) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: systemPrompt(task) },
        { role: "user", content: openAiUserContent(task, profile, job, extra) },
      ],
      text: {
        format: { type: "json_object" },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  const parsed = parseJsonPayload<T>(extractResponseText(payload));
  if (!parsed) throw new Error("OpenAI did not return parseable JSON");
  return { parsed, provider: "openai", model };
}

async function callOpenCompatible<T>(
  provider: "agnes" | "gmi",
  task: AiTask,
  profile: ParsedProfile,
  job: NormalizedJob,
  extra?: unknown,
) {
  const prefix = provider === "agnes" ? "AGNES" : "GMI";
  const apiKey = process.env[`${prefix}_API_KEY`];
  const baseUrl = process.env[`${prefix}_API_BASE_URL`];
  const model = process.env[`${prefix}_MODEL`] || "default";
  if (!apiKey || !baseUrl) throw new Error(`${prefix}_API_KEY or ${prefix}_API_BASE_URL is not configured`);

  const response = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt(task) },
        { role: "user", content: inputPayload(task, profile, job, extra) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`${provider} ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const parsed = parseJsonPayload<T>(payload.choices?.[0]?.message?.content || "");
  if (!parsed) throw new Error(`${provider} did not return parseable JSON`);
  return { parsed, provider, model };
}

async function callPrimary<T>(task: AiTask, profile: ParsedProfile, job: NormalizedJob, extra?: unknown) {
  const provider = (process.env.AI_PRIMARY_PROVIDER || "openai").toLowerCase();
  if (provider === "agnes") return callOpenCompatible<T>("agnes", task, profile, job, extra);
  if (provider === "gmi") return callOpenCompatible<T>("gmi", task, profile, job, extra);
  return callOpenAI<T>(task, profile, job, extra);
}

function withProvider<T extends { provider: string; model: string; latencyMs: number }>(
  value: T,
  provider: string,
  model: string,
  started: number,
) {
  return {
    ...value,
    provider,
    model,
    latencyMs: Date.now() - started,
  };
}

export async function analyzeFit(
  profile: ParsedProfile,
  job: NormalizedJob,
  userId?: string,
): Promise<FitAnalysisResult> {
  const started = Date.now();
  const fallback = buildFitAnalysis(profile, job);

  if (mockMode()) {
    await recordApiRun({
      userId,
      type: "ai.fit_analysis",
      provider: "mock",
      modelOrEndpoint: fallback.model,
      status: "mocked",
      latencyMs: fallback.latencyMs,
    });
    return fallback;
  }

  try {
    const result = await callPrimary<FitAnalysisResult>("fit_analysis", profile, job);
    await recordApiRun({
      userId,
      type: "ai.fit_analysis",
      provider: result.provider,
      modelOrEndpoint: result.model,
      status: "ok",
      latencyMs: Date.now() - started,
    });
    return withProvider(sanitizeFitResult(result.parsed, fallback), result.provider, result.model, started);
  } catch (error) {
    await recordApiRun({
      userId,
      type: "ai.fit_analysis",
      provider: process.env.AI_PRIMARY_PROVIDER || "openai",
      modelOrEndpoint: process.env.OPENAI_MODEL || "configured-model",
      status: "failed",
      latencyMs: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "Unknown AI error",
    });
    return fallback;
  }
}

export async function generateApplicationPack(
  profile: ParsedProfile,
  job: NormalizedJob,
  analysis: FitAnalysisResult,
  userId?: string,
  extra?: unknown,
): Promise<ApplicationPackResult> {
  const started = Date.now();
  const fallback = buildApplicationPack(profile, job, analysis);

  if (mockMode()) {
    await recordApiRun({
      userId,
      type: "ai.application_pack",
      provider: "mock",
      modelOrEndpoint: fallback.model,
      status: "mocked",
      latencyMs: fallback.latencyMs,
    });
    return fallback;
  }

  try {
    const result = await callPrimary<ApplicationPackResult>("application_pack", profile, job, {
      analysis,
      ...(isRecord(extra) ? extra : {}),
    });
    await recordApiRun({
      userId,
      type: "ai.application_pack",
      provider: result.provider,
      modelOrEndpoint: result.model,
      status: "ok",
      latencyMs: Date.now() - started,
    });
    return withProvider(sanitizeApplicationPack(result.parsed, fallback), result.provider, result.model, started);
  } catch (error) {
    await recordApiRun({
      userId,
      type: "ai.application_pack",
      provider: process.env.AI_PRIMARY_PROVIDER || "openai",
      modelOrEndpoint: process.env.OPENAI_MODEL || "configured-model",
      status: "failed",
      latencyMs: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "Unknown AI error",
    });
    return fallback;
  }
}

export async function generateInterviewPrep(
  profile: ParsedProfile,
  job: NormalizedJob,
  analysis: FitAnalysisResult,
  userId?: string,
): Promise<InterviewPrepResult> {
  const started = Date.now();
  const fallback = buildInterviewPrep(profile, job, analysis);

  if (mockMode()) {
    await recordApiRun({
      userId,
      type: "ai.interview_prep",
      provider: "mock",
      modelOrEndpoint: fallback.model,
      status: "mocked",
      latencyMs: fallback.latencyMs,
    });
    return fallback;
  }

  try {
    const result = await callPrimary<InterviewPrepResult>("interview_prep", profile, job, analysis);
    await recordApiRun({
      userId,
      type: "ai.interview_prep",
      provider: result.provider,
      modelOrEndpoint: result.model,
      status: "ok",
      latencyMs: Date.now() - started,
    });
    return withProvider(sanitizeInterviewPrep(result.parsed, fallback), result.provider, result.model, started);
  } catch (error) {
    await recordApiRun({
      userId,
      type: "ai.interview_prep",
      provider: process.env.AI_PRIMARY_PROVIDER || "openai",
      modelOrEndpoint: process.env.OPENAI_MODEL || "configured-model",
      status: "failed",
      latencyMs: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "Unknown AI error",
    });
    return fallback;
  }
}
