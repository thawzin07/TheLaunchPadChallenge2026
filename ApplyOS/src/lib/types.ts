export type ApiStatus = "ready" | "configured" | "missing_config" | "failed" | "mocked";

export type ConnectorStatus = {
  source: string;
  label: string;
  status: ApiStatus;
  message: string;
};

export type EvidenceItem = {
  id: string;
  label: string;
  detail: string;
  tags: string[];
};

export type ParsedProfile = {
  headline: string;
  summary: string;
  resumeText: string;
  education: string[];
  skills: string[];
  projects: EvidenceItem[];
  experience: EvidenceItem[];
  certifications: string[];
  coursework: string[];
  preferences: {
    targetRoles?: string[];
    locations?: string[];
    workModes?: string[];
  };
  evidence: EvidenceItem[];
};

export type NormalizedJob = {
  id?: string;
  source: "mycareersfuture" | "adzuna" | "greenhouse" | "lever" | "mock";
  sourceJobId: string;
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  employmentTypes: string[];
  seniority: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  postedAt?: string;
  expiresAt?: string;
  descriptionText: string;
  skills: string[];
  rawSourceHash: string;
};

export type ScoredJob = NormalizedJob & {
  id: string;
  roughFitScore: number;
  topMatches: string[];
  topGaps: string[];
  saved?: boolean;
};

export type RequirementMatch = {
  requirement: string;
  status: "strong" | "partial" | "gap" | "unsupported" | "review";
  evidence: string;
};

export type EvidenceMatch = {
  claim: string;
  evidence: string;
  status: "strong" | "partial" | "gap" | "unsupported" | "review";
};

export type FitAnalysisResult = {
  overallScore: number;
  confidence: "low" | "medium" | "high";
  summary: string;
  matchedRequirements: RequirementMatch[];
  missingRequirements: string[];
  evidenceMatches: EvidenceMatch[];
  risks: string[];
  recommendations: string[];
  provider: string;
  model: string;
  latencyMs: number;
};

export type ApplicationPackResult = {
  resumeBullets: string[];
  resumeDraft: string;
  coverLetter: string;
  recruiterMessage: string;
  keywords: string[];
  claimsToAvoid: string[];
  evidenceLinks: EvidenceMatch[];
  provider: string;
  model: string;
  latencyMs: number;
};

export type InterviewPrepResult = {
  questions: string[];
  answerGuidance: string[];
  gapQuestions: string[];
  technicalTopics: string[];
  behavioralStories: string[];
  provider: string;
  model: string;
  latencyMs: number;
};
