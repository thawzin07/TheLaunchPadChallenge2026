import { createHash } from "node:crypto";
import type { Application, JobListing } from "@prisma/client";

import { ensureDatabase, recordApiRun, prisma } from "@/lib/db";
import { compactList, parseJson, stringifyJson } from "@/lib/json";
import { scoreJob, extractSkills } from "@/lib/scoring";
import type { ConnectorStatus, NormalizedJob, ParsedProfile, ScoredJob } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

const DEFAULT_TIMEOUT_MS = 7000;

const mockJobs: NormalizedJob[] = [
  {
    source: "mock",
    sourceJobId: "mock-software-engineer-intern",
    sourceUrl: "https://www.mycareersfuture.gov.sg/",
    title: "Software Engineer Intern",
    company: "GovTech-style Product Team",
    location: "Singapore",
    workMode: "hybrid",
    employmentTypes: ["internship"],
    seniority: ["student", "fresh graduate"],
    salaryMin: 1200,
    salaryMax: 1800,
    salaryCurrency: "SGD",
    postedAt: new Date().toISOString(),
    descriptionText:
      "Build React and Next.js features, integrate REST APIs, write TypeScript, work with SQL data, test user flows, and communicate technical trade-offs with designers and product managers.",
    skills: ["React", "Next.js", "TypeScript", "REST APIs", "SQL", "Testing", "Communication"],
    rawSourceHash: "mock-software-engineer-intern",
  },
  {
    source: "mock",
    sourceJobId: "mock-ai-engineer-intern",
    sourceUrl: "https://www.mycareersfuture.gov.sg/",
    title: "AI Engineer Intern",
    company: "Applied AI Lab Singapore",
    location: "Singapore",
    workMode: "onsite",
    employmentTypes: ["internship"],
    seniority: ["student"],
    salaryMin: 1400,
    salaryMax: 2200,
    salaryCurrency: "SGD",
    postedAt: new Date().toISOString(),
    descriptionText:
      "Prototype AI workflows, use OpenAI API and Python, evaluate model outputs, connect tools to product interfaces, and document risks, evidence, and failure cases.",
    skills: ["Python", "OpenAI API", "Machine learning", "REST APIs", "Data visualization", "Testing"],
    rawSourceHash: "mock-ai-engineer-intern",
  },
  {
    source: "mock",
    sourceJobId: "mock-data-engineer-intern",
    sourceUrl: "https://www.mycareersfuture.gov.sg/",
    title: "Data Engineer Intern",
    company: "Regional Marketplace Analytics",
    location: "Singapore",
    workMode: "hybrid",
    employmentTypes: ["internship"],
    seniority: ["student", "fresh graduate"],
    salaryMin: 1300,
    salaryMax: 2000,
    salaryCurrency: "SGD",
    postedAt: new Date().toISOString(),
    descriptionText:
      "Support ETL workflows, write SQL queries, maintain dashboards, use Python for data cleaning, and explain findings clearly to business stakeholders.",
    skills: ["Python", "SQL", "ETL", "Data visualization", "Communication"],
    rawSourceHash: "mock-data-engineer-intern",
  },
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
  }
  return undefined;
}

function getPath(record: UnknownRecord, paths: string[][]) {
  for (const path of paths) {
    let cursor: unknown = record;
    for (const key of path) {
      if (!isRecord(cursor)) {
        cursor = undefined;
        break;
      }
      cursor = cursor[key];
    }
    if (cursor !== undefined && cursor !== null && cursor !== "") return cursor;
  }
  return undefined;
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function hashRecord(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function toArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) return Object.values(value);
  return [];
}

function pickItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const candidates = [
    payload.results,
    payload.jobs,
    payload.data,
    isRecord(payload.data) ? payload.data.results : undefined,
    isRecord(payload.data) ? payload.data.jobs : undefined,
    isRecord(payload.results) ? payload.results.jobs : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function dateString(value: unknown) {
  const stringValue = asString(value);
  if (!stringValue) return undefined;
  const date = new Date(stringValue);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function sourceSafeId(prefix: string, item: UnknownRecord, index: number) {
  return (
    asString(getPath(item, [["uuid"], ["id"], ["jobId"], ["job_id"], ["metadata", "jobPostId"], ["guid"]])) ||
    `${prefix}-${hashRecord(item).slice(0, 16)}-${index}`
  );
}

function normalizeMyCareersFuture(item: unknown, index: number): NormalizedJob | null {
  if (!isRecord(item)) return null;

  const title = asString(getPath(item, [["title"], ["jobTitle"], ["positionTitle"]]));
  const company = asString(getPath(item, [["company", "name"], ["postedCompany", "name"], ["companyName"], ["company"]]));
  if (!title || !company) return null;

  const id = sourceSafeId("mcf", item, index);
  const description = stripHtml(
    asString(
      getPath(item, [
        ["description"],
        ["jobDescription"],
        ["rolesAndResponsibilities"],
        ["requirements"],
        ["descriptionText"],
      ]),
    ),
  );

  const skills = compactList([
    ...toArray(getPath(item, [["skills"], ["categories"], ["ssocSkills"]])).map((skill) =>
      isRecord(skill) ? asString(skill.name ?? skill.title ?? skill.skill) : asString(skill),
    ),
    ...extractSkills(description),
  ]);

  return {
    source: "mycareersfuture",
    sourceJobId: id,
    sourceUrl:
      asString(getPath(item, [["sourceUrl"], ["url"], ["jobUrl"]])) ||
      `https://www.mycareersfuture.gov.sg/job/${id}`,
    title,
    company,
    location:
      asString(getPath(item, [["location"], ["address"], ["metadata", "jobLocation"]])) || "Singapore",
    workMode: asString(getPath(item, [["workMode"], ["workplaceType"]])) || "unknown",
    employmentTypes: compactList([
      asString(getPath(item, [["employmentType"], ["employmentTypeDescription"], ["metadata", "employmentType"]])),
    ]),
    seniority: compactList([asString(getPath(item, [["seniority"], ["minimumYearsExperience"]]))]),
    salaryMin: asNumber(getPath(item, [["salary", "minimum"], ["salaryMin"], ["minimumSalary"]])),
    salaryMax: asNumber(getPath(item, [["salary", "maximum"], ["salaryMax"], ["maximumSalary"]])),
    salaryCurrency: asString(getPath(item, [["salary", "currency"], ["salaryCurrency"]])) || "SGD",
    postedAt: dateString(getPath(item, [["postedAt"], ["createdAt"], ["metadata", "newPostingDate"]])),
    expiresAt: dateString(getPath(item, [["expiresAt"], ["expiryDate"], ["metadata", "expiryDate"]])),
    descriptionText: description || `${title} role at ${company}.`,
    skills,
    rawSourceHash: hashRecord(item),
  };
}

function normalizeAdzuna(item: unknown, index: number): NormalizedJob | null {
  if (!isRecord(item)) return null;
  const title = asString(item.title);
  const company = asString(getPath(item, [["company", "display_name"], ["company"], ["company_name"]]));
  if (!title || !company) return null;
  const description = stripHtml(asString(item.description));

  return {
    source: "adzuna",
    sourceJobId: asString(item.id) || `adzuna-${index}-${hashRecord(item).slice(0, 12)}`,
    sourceUrl: asString(item.redirect_url) || "https://www.adzuna.sg/",
    title,
    company,
    location: asString(getPath(item, [["location", "display_name"], ["location"]])) || "Singapore",
    workMode: "unknown",
    employmentTypes: compactList([asString(item.contract_type), asString(item.category)]),
    seniority: [],
    salaryMin: asNumber(item.salary_min),
    salaryMax: asNumber(item.salary_max),
    salaryCurrency: "SGD",
    postedAt: dateString(item.created),
    descriptionText: description,
    skills: extractSkills(`${title} ${description}`),
    rawSourceHash: hashRecord(item),
  };
}

function normalizeGreenhouse(item: unknown, board: string): NormalizedJob | null {
  if (!isRecord(item)) return null;
  const title = asString(item.title);
  if (!title) return null;
  const description = stripHtml(asString(item.content));

  return {
    source: "greenhouse",
    sourceJobId: asString(item.id) || `${board}-${hashRecord(item).slice(0, 12)}`,
    sourceUrl: asString(item.absolute_url) || `https://boards.greenhouse.io/${board}`,
    title,
    company: board,
    location: asString(getPath(item, [["location", "name"]])) || "Singapore",
    workMode: "unknown",
    employmentTypes: [],
    seniority: [],
    postedAt: dateString(item.updated_at),
    salaryCurrency: "SGD",
    descriptionText: description,
    skills: extractSkills(`${title} ${description}`),
    rawSourceHash: hashRecord(item),
  };
}

function normalizeLever(item: unknown, handle: string): NormalizedJob | null {
  if (!isRecord(item)) return null;
  const title = asString(item.text);
  if (!title) return null;
  const description = stripHtml(
    compactList([asString(item.descriptionPlain), asString(item.description), asString(item.additionalPlain)]).join(" "),
  );

  return {
    source: "lever",
    sourceJobId: asString(item.id) || `${handle}-${hashRecord(item).slice(0, 12)}`,
    sourceUrl: asString(item.hostedUrl) || `https://jobs.lever.co/${handle}`,
    title,
    company: handle,
    location: asString(getPath(item, [["categories", "location"]])) || "Singapore",
    workMode: asString(getPath(item, [["workplaceType"]])) || "unknown",
    employmentTypes: compactList([asString(getPath(item, [["categories", "commitment"]]))]),
    seniority: compactList([asString(getPath(item, [["categories", "level"]]))]),
    salaryCurrency: "SGD",
    descriptionText: description,
    skills: extractSkills(`${title} ${description}`),
    rawSourceHash: hashRecord(item),
  };
}

async function fetchJson(url: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": "ApplyOS/1.0 job-discovery",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchMyCareersFuture(query: string, limit: number) {
  const started = Date.now();
  const endpoint = new URL("https://api.mycareersfuture.gov.sg/v2/jobs");
  endpoint.searchParams.set("search", query || "software intern");
  endpoint.searchParams.set("limit", String(limit));

  try {
    const payload = await fetchJson(endpoint.toString());
    const jobs = pickItems(payload)
      .map((item, index) => normalizeMyCareersFuture(item, index))
      .filter((job): job is NormalizedJob => Boolean(job));
    await recordApiRun({
      type: "jobs",
      provider: "mycareersfuture",
      modelOrEndpoint: endpoint.origin,
      status: "ok",
      latencyMs: Date.now() - started,
    });
    return {
      jobs,
      status: {
        source: "mycareersfuture",
        label: "MyCareersFuture",
        status: jobs.length ? "ready" : "failed",
        message: jobs.length ? `${jobs.length} jobs normalized` : "No jobs returned",
      } satisfies ConnectorStatus,
    };
  } catch (error) {
    await recordApiRun({
      type: "jobs",
      provider: "mycareersfuture",
      modelOrEndpoint: endpoint.origin,
      status: "failed",
      latencyMs: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      jobs: [],
      status: {
        source: "mycareersfuture",
        label: "MyCareersFuture",
        status: "failed",
        message: error instanceof Error ? error.message : "Could not fetch jobs",
      } satisfies ConnectorStatus,
    };
  }
}

async function fetchAdzuna(query: string, limit: number) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY || "sg";

  if (!appId || !appKey) {
    return {
      jobs: [],
      status: {
        source: "adzuna",
        label: "Adzuna SG",
        status: "missing_config",
        message: "Add ADZUNA_APP_ID and ADZUNA_APP_KEY to enable",
      } satisfies ConnectorStatus,
    };
  }

  const started = Date.now();
  const endpoint = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
  endpoint.searchParams.set("app_id", appId);
  endpoint.searchParams.set("app_key", appKey);
  endpoint.searchParams.set("results_per_page", String(limit));
  endpoint.searchParams.set("what", query || "software intern");
  endpoint.searchParams.set("where", "Singapore");

  try {
    const payload = await fetchJson(endpoint.toString());
    const jobs = pickItems(payload)
      .map((item, index) => normalizeAdzuna(item, index))
      .filter((job): job is NormalizedJob => Boolean(job));
    await recordApiRun({
      type: "jobs",
      provider: "adzuna",
      modelOrEndpoint: endpoint.origin,
      status: "ok",
      latencyMs: Date.now() - started,
    });
    return {
      jobs,
      status: {
        source: "adzuna",
        label: "Adzuna SG",
        status: "ready",
        message: `${jobs.length} jobs normalized`,
      } satisfies ConnectorStatus,
    };
  } catch (error) {
    await recordApiRun({
      type: "jobs",
      provider: "adzuna",
      modelOrEndpoint: endpoint.origin,
      status: "failed",
      latencyMs: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      jobs: [],
      status: {
        source: "adzuna",
        label: "Adzuna SG",
        status: "failed",
        message: error instanceof Error ? error.message : "Could not fetch Adzuna",
      } satisfies ConnectorStatus,
    };
  }
}

async function fetchGreenhouse(limit: number) {
  const boards = compactList((process.env.GREENHOUSE_BOARD_TOKENS || "").split(","));
  if (!boards.length) {
    return {
      jobs: [],
      status: {
        source: "greenhouse",
        label: "Greenhouse",
        status: "missing_config",
        message: "Add GREENHOUSE_BOARD_TOKENS to enable",
      } satisfies ConnectorStatus,
    };
  }

  const jobs: NormalizedJob[] = [];
  const started = Date.now();

  for (const board of boards.slice(0, 6)) {
    const endpoint = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
    try {
      const payload = await fetchJson(endpoint);
      jobs.push(
        ...pickItems(payload)
          .slice(0, limit)
          .map((item) => normalizeGreenhouse(item, board))
          .filter((job): job is NormalizedJob => Boolean(job)),
      );
    } catch {
      // One company board should not fail the whole connector.
    }
  }

  await recordApiRun({
    type: "jobs",
    provider: "greenhouse",
    modelOrEndpoint: "boards-api.greenhouse.io",
    status: jobs.length ? "ok" : "failed",
    latencyMs: Date.now() - started,
  });

  return {
    jobs,
    status: {
      source: "greenhouse",
      label: "Greenhouse",
      status: jobs.length ? "ready" : "failed",
      message: jobs.length ? `${jobs.length} jobs normalized` : "Configured boards returned no jobs",
    } satisfies ConnectorStatus,
  };
}

async function fetchLever(limit: number) {
  const handles = compactList((process.env.LEVER_COMPANY_HANDLES || "").split(","));
  if (!handles.length) {
    return {
      jobs: [],
      status: {
        source: "lever",
        label: "Lever",
        status: "missing_config",
        message: "Add LEVER_COMPANY_HANDLES to enable",
      } satisfies ConnectorStatus,
    };
  }

  const jobs: NormalizedJob[] = [];
  const started = Date.now();

  for (const handle of handles.slice(0, 8)) {
    try {
      const payload = await fetchJson(`https://api.lever.co/v0/postings/${handle}?mode=json`);
      jobs.push(
        ...pickItems(payload)
          .slice(0, limit)
          .map((item) => normalizeLever(item, handle))
          .filter((job): job is NormalizedJob => Boolean(job)),
      );
    } catch {
      // Keep going across configured companies.
    }
  }

  await recordApiRun({
    type: "jobs",
    provider: "lever",
    modelOrEndpoint: "api.lever.co",
    status: jobs.length ? "ok" : "failed",
    latencyMs: Date.now() - started,
  });

  return {
    jobs,
    status: {
      source: "lever",
      label: "Lever",
      status: jobs.length ? "ready" : "failed",
      message: jobs.length ? `${jobs.length} jobs normalized` : "Configured handles returned no jobs",
    } satisfies ConnectorStatus,
  };
}

export async function discoverJobs(query: string, limit = 20) {
  const [mcf, adzuna, greenhouse, lever] = await Promise.all([
    fetchMyCareersFuture(query, limit),
    fetchAdzuna(query, limit),
    fetchGreenhouse(Math.min(limit, 10)),
    fetchLever(Math.min(limit, 10)),
  ]);

  const seen = new Set<string>();
  const jobs = [...mcf.jobs, ...adzuna.jobs, ...greenhouse.jobs, ...lever.jobs].filter((job) => {
    const key = `${job.source}:${job.sourceJobId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const statuses: ConnectorStatus[] = [mcf.status, adzuna.status, greenhouse.status, lever.status];
  if (!jobs.length) {
    statuses.push({
      source: "mock",
      label: "Mock fallback",
      status: "mocked",
      message: "Using seeded Singapore internship jobs",
    });
  }

  return {
    jobs: jobs.length ? jobs.slice(0, limit * 2) : mockJobs,
    statuses,
  };
}

function nullableDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function upsertJobs(jobs: NormalizedJob[]) {
  await ensureDatabase();

  const stored: JobListing[] = [];
  for (const job of jobs) {
    stored.push(
      await prisma.jobListing.upsert({
        where: {
          source_sourceJobId: {
            source: job.source,
            sourceJobId: job.sourceJobId,
          },
        },
        update: {
          sourceUrl: job.sourceUrl,
          title: job.title,
          company: job.company,
          location: job.location,
          workMode: job.workMode,
          employmentTypeJson: stringifyJson(job.employmentTypes),
          seniorityJson: stringifyJson(job.seniority),
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          postedAt: nullableDate(job.postedAt),
          expiresAt: nullableDate(job.expiresAt),
          descriptionText: job.descriptionText,
          skillsJson: stringifyJson(job.skills),
          rawSourceHash: job.rawSourceHash,
          fetchedAt: new Date(),
        },
        create: {
          source: job.source,
          sourceJobId: job.sourceJobId,
          sourceUrl: job.sourceUrl,
          title: job.title,
          company: job.company,
          location: job.location,
          workMode: job.workMode,
          employmentTypeJson: stringifyJson(job.employmentTypes),
          seniorityJson: stringifyJson(job.seniority),
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          postedAt: nullableDate(job.postedAt),
          expiresAt: nullableDate(job.expiresAt),
          descriptionText: job.descriptionText,
          skillsJson: stringifyJson(job.skills),
          rawSourceHash: job.rawSourceHash,
        },
      }),
    );
  }

  return stored;
}

export function normalizeStoredJob(job: JobListing): NormalizedJob & { id: string } {
  return {
    id: job.id,
    source: job.source as NormalizedJob["source"],
    sourceJobId: job.sourceJobId,
    sourceUrl: job.sourceUrl,
    title: job.title,
    company: job.company,
    location: job.location,
    workMode: job.workMode,
    employmentTypes: parseJson<string[]>(job.employmentTypeJson, []),
    seniority: parseJson<string[]>(job.seniorityJson, []),
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    salaryCurrency: job.salaryCurrency,
    postedAt: job.postedAt?.toISOString(),
    expiresAt: job.expiresAt?.toISOString(),
    descriptionText: job.descriptionText,
    skills: parseJson<string[]>(job.skillsJson, []),
    rawSourceHash: job.rawSourceHash,
  };
}

export function toScoredJob(
  profile: ParsedProfile,
  job: JobListing,
  applications: Pick<Application, "jobListingId">[] = [],
): ScoredJob {
  const normalized = normalizeStoredJob(job);
  const scored = scoreJob(profile, normalized);

  return {
    ...normalized,
    roughFitScore: scored.score,
    topMatches: scored.topMatches,
    topGaps: scored.topGaps,
    saved: applications.some((application) => application.jobListingId === job.id),
  };
}
