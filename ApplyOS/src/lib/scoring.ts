import type {
  ApplicationPackResult,
  EvidenceMatch,
  FitAnalysisResult,
  InterviewPrepResult,
  NormalizedJob,
  ParsedProfile,
  RequirementMatch,
} from "@/lib/types";

const SKILL_DICTIONARY = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "PostgreSQL",
  "Prisma",
  "REST APIs",
  "GraphQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "OpenAI API",
  "Machine learning",
  "Data visualization",
  "ETL",
  "Testing",
  "Git",
  "Agile",
  "Communication",
  "Teamwork",
];

const STOPWORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "that",
  "this",
  "you",
  "our",
  "will",
  "are",
  "from",
  "have",
  "has",
  "your",
  "into",
  "work",
  "role",
  "team",
  "using",
  "about",
  "across",
]);

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.+#\s-]/g, " ");
}

function tokens(value: string) {
  return normalize(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export function extractSkills(text: string) {
  const haystack = normalize(text);
  return SKILL_DICTIONARY.filter((skill) => haystack.includes(normalize(skill)));
}

export function scoreJob(profile: ParsedProfile, job: NormalizedJob) {
  const profileSkills = new Set(profile.skills.map((skill) => normalize(skill)));
  const jobSkills = job.skills.length > 0 ? job.skills : extractSkills(job.descriptionText);
  const matchedSkills = jobSkills.filter((skill) => profileSkills.has(normalize(skill)));
  const missingSkills = jobSkills.filter((skill) => !profileSkills.has(normalize(skill))).slice(0, 5);

  const profileText = [
    profile.headline,
    profile.summary,
    profile.resumeText,
    profile.skills.join(" "),
    profile.projects.map((project) => project.detail).join(" "),
    profile.experience.map((experience) => experience.detail).join(" "),
  ].join(" ");
  const profileTokens = new Set(tokens(profileText));
  const jobTokens = Array.from(new Set(tokens(`${job.title} ${job.descriptionText}`))).slice(0, 80);
  const keywordMatches = jobTokens.filter((token) => profileTokens.has(token)).slice(0, 8);

  const skillScore =
    jobSkills.length === 0 ? 45 : Math.round((matchedSkills.length / Math.max(jobSkills.length, 1)) * 55);
  const keywordScore = Math.min(30, keywordMatches.length * 4);
  const evidenceScore = profile.evidence.length + profile.projects.length > 1 ? 15 : 5;
  const score = Math.max(18, Math.min(94, skillScore + keywordScore + evidenceScore));

  return {
    score,
    topMatches: Array.from(new Set([...matchedSkills, ...keywordMatches])).slice(0, 5),
    topGaps: missingSkills.length ? missingSkills : ["Clarify role-specific examples", "Add measurable impact"],
  };
}

function evidenceFor(profile: ParsedProfile, requirement: string) {
  const haystack = normalize(requirement);
  const evidence = [...profile.projects, ...profile.experience, ...profile.evidence];
  return (
    evidence.find((item) => item.tags.some((tag) => haystack.includes(normalize(tag)))) ??
    evidence.find((item) => normalize(item.detail).split(" ").some((word) => haystack.includes(word)))
  );
}

export function buildFitAnalysis(profile: ParsedProfile, job: NormalizedJob): FitAnalysisResult {
  const started = Date.now();
  const scored = scoreJob(profile, job);
  const jobSkills = job.skills.length > 0 ? job.skills : extractSkills(job.descriptionText);

  const matchedRequirements: RequirementMatch[] = jobSkills.slice(0, 8).map((skill) => {
    const hasSkill = profile.skills.some((profileSkill) => normalize(profileSkill) === normalize(skill));
    const evidence = evidenceFor(profile, skill);
    return {
      requirement: skill,
      status: hasSkill && evidence ? "strong" : hasSkill ? "partial" : "gap",
      evidence: evidence
        ? `${evidence.label}: ${evidence.detail}`
        : hasSkill
          ? `${skill} appears in the profile, but needs a stronger proof point.`
          : `No strong evidence found for ${skill}.`,
    };
  });

  const evidenceMatches: EvidenceMatch[] = matchedRequirements.map((match) => ({
    claim: `Candidate can contribute to ${match.requirement}.`,
    evidence: match.evidence,
    status: match.status,
  }));

  return {
    overallScore: scored.score,
    confidence: profile.resumeText && job.descriptionText ? "high" : "medium",
    summary: `${job.title} at ${job.company} is a ${scored.score >= 72 ? "strong" : scored.score >= 55 ? "workable" : "stretch"} fit. The safest application angle is to lead with ${scored.topMatches[0] ?? "relevant project evidence"} and close gaps honestly.`,
    matchedRequirements,
    missingRequirements: scored.topGaps,
    evidenceMatches,
    risks: [
      "Do not claim direct production experience unless the profile evidence supports it.",
      "Add measurable project impact before submitting if the job asks for ownership.",
      scored.score < 60 ? "This is a stretch role unless the resume is tightened around the top requirements." : "Keep the application concise and evidence-led.",
    ],
    recommendations: [
      `Use the first resume third to show ${scored.topMatches.slice(0, 3).join(", ") || "role alignment"}.`,
      `Add one bullet that mirrors ${job.company}'s problem space without copying the job description.`,
      "Prepare one story about debugging, one about teamwork, and one about learning quickly.",
    ],
    provider: "mock",
    model: "deterministic-fit-v1",
    latencyMs: Date.now() - started,
  };
}

export function buildApplicationPack(
  profile: ParsedProfile,
  job: NormalizedJob,
  analysis: FitAnalysisResult,
): ApplicationPackResult {
  const started = Date.now();
  const topEvidence = analysis.evidenceMatches.filter((match) => match.status !== "gap").slice(0, 3);
  const matched = analysis.matchedRequirements
    .filter((match) => match.status === "strong" || match.status === "partial")
    .map((match) => match.requirement)
    .slice(0, 6);

  return {
    resumeBullets: [
      `Built full-stack product workflows using ${matched.slice(0, 3).join(", ") || "modern web tools"}, with emphasis on reliable user-facing delivery.`,
      `Connected APIs, normalized data, and designed fallback states to keep the application useful when external services fail.`,
      `Translated project evidence into clear product decisions, user flows, and demo-ready outputs for reviewers.`,
    ],
    resumeDraft: `${profile.headline || "Student developer"}\n\n${profile.summary || profile.resumeText}\n\nRelevant strengths for ${job.title}: ${matched.join(", ") || "fast learning, product thinking, and technical execution"}.\n\nSelected evidence:\n${topEvidence.map((item) => `- ${item.evidence}`).join("\n")}`,
    coverLetter: `Dear ${job.company} team,\n\nI am applying for the ${job.title} role because it matches the way I like to work: build practical software, understand the user's workflow, and prove claims with evidence. My strongest fit is in ${matched.slice(0, 3).join(", ") || "full-stack product development"}.\n\nA relevant example is ${topEvidence[0]?.evidence || "my recent work turning product requirements into a working application with authentication, data models, integrations, and a polished demo flow"}. I would bring the same discipline to your team: clarify the problem, ship carefully, and communicate trade-offs clearly.\n\nThank you for considering my application.\n\nBest regards,\n${profile.headline ? profile.headline.split(" targeting ")[0] : "Applicant"}`,
    recruiterMessage: `Hi, I am interested in the ${job.title} role at ${job.company}. My closest evidence is ${topEvidence[0]?.evidence || "building full-stack, API-driven product prototypes"}. I would appreciate the chance to apply and discuss fit.`,
    keywords: Array.from(new Set([...matched, ...job.skills])).slice(0, 12),
    claimsToAvoid: [
      "Expert-level ownership unless the profile has direct evidence.",
      "Company-specific impact without having worked there.",
      "Unsupported claims about production scale.",
    ],
    evidenceLinks: topEvidence,
    provider: "mock",
    model: "deterministic-pack-v1",
    latencyMs: Date.now() - started,
  };
}

export function buildInterviewPrep(
  profile: ParsedProfile,
  job: NormalizedJob,
  analysis: FitAnalysisResult,
): InterviewPrepResult {
  const started = Date.now();
  const topSkills = analysis.matchedRequirements.map((match) => match.requirement).slice(0, 5);
  const gaps = analysis.missingRequirements.slice(0, 4);

  return {
    questions: [
      `Walk me through a project that proves you can succeed as a ${job.title}.`,
      `How would you learn an unfamiliar part of ${job.company}'s stack in your first two weeks?`,
      "Describe a time you found a bug or weak assumption and fixed it.",
      "How do you decide what to build first when the product scope is large?",
      `What interests you about ${job.company} and this role?`,
    ],
    answerGuidance: [
      `Lead with ${profile.projects[0]?.label || "one concrete project"}, then explain problem, action, result, and what you learned.`,
      `Mention ${topSkills.join(", ") || "your closest matching skills"} only where you can attach evidence.`,
      "For weak areas, say the truth, then show the learning plan and nearest transferable evidence.",
      "Keep answers under two minutes and end with the business/user impact.",
    ],
    gapQuestions: gaps.map((gap) => `If asked about ${gap}, explain your nearest related experience and a 30-day learning plan.`),
    technicalTopics: topSkills.length ? topSkills : ["APIs", "data modeling", "debugging", "testing"],
    behavioralStories: [
      "A project that changed scope and how you handled it.",
      "A time you worked with incomplete requirements.",
      "A time you received feedback and improved the output.",
    ],
    provider: "mock",
    model: "deterministic-interview-v1",
    latencyMs: Date.now() - started,
  };
}
