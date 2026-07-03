import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_BASE_URL = "https://applyos-sable.vercel.app";
const DEFAULT_EXPECTED_AI_PROVIDER = "openai";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function splitSetCookie(header) {
  if (!header) return [];
  return header.split(/,(?=\s*[^;,]+=)/g);
}

function cookieHeader(cookies) {
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function absorbCookies(cookies, response) {
  const setCookieValues =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : splitSetCookie(response.headers.get("set-cookie"));

  for (const value of setCookieValues) {
    const pair = value.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

async function request(baseUrl, cookies, pathname, options = {}) {
  const headers = new Headers(options.headers || {});
  const currentCookies = cookieHeader(cookies);
  if (currentCookies) headers.set("cookie", currentCookies);

  const response = await fetch(`${baseUrl}${pathname}`, { ...options, headers });
  absorbCookies(cookies, response);

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { response, body, text };
}

async function expectStatus(baseUrl, label, pathname, expectedStatus, options = {}, cookies = new Map()) {
  const result = await request(baseUrl, cookies, pathname, options);
  assert(
    result.response.status === expectedStatus,
    `${label} expected ${expectedStatus}, received ${result.response.status}: ${result.text}`,
  );
  console.log(`${label}=ok status=${result.response.status}`);
  return result;
}

async function api(baseUrl, cookies, pathname, options = {}) {
  const result = await request(baseUrl, cookies, pathname, options);
  assert(result.response.ok, `${pathname} failed ${result.response.status}: ${result.text}`);
  return result.body;
}

async function main() {
  loadEnv(path.resolve(".env"));
  loadEnv(path.resolve(".env.local"));

  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"];
  for (const key of required) {
    assert(process.env[key], `Missing ${key}. Populate .env before running the production smoke test.`);
  }

  const baseUrl = (process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const expectedAiProvider = process.env.SMOKE_EXPECT_AI_PROVIDER || DEFAULT_EXPECTED_AI_PROVIDER;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "resumes";
  const suffix = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const email = `codex-prod-${suffix}@example.com`;
  const password = `CodexProd2026!${suffix}`;
  const source = "mock";
  const sourceJobId = `codex-prod-smoke-${suffix}`;

  const { createClient } = await import("@supabase/supabase-js");
  const { PrismaClient } = await import("@prisma/client");

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const prisma = new PrismaClient();
  const cookies = new Map();
  const uploadedPaths = [];
  let authUserId = null;
  let jobId = null;
  let resumeId = null;

  try {
    const health = await api(baseUrl, cookies, "/api/health");
    const services = new Map((health.services || []).map((service) => [service.key, service]));
    assert(services.get("database")?.status === "ready", "Health check did not report database ready.");
    assert(services.get("supabase_storage")?.status === "configured", "Health check did not report storage configured.");
    assert(services.get("openai")?.status === "configured", "Health check did not report OpenAI configured.");
    console.log(`health=ok base=${baseUrl}`);

    await expectStatus(baseUrl, "weakSignupGuard", "/api/auth/signup", 400, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Live Test", email: `weak-${suffix}@example.com`, password: "password123" }),
    });

    await expectStatus(baseUrl, "malformedSignupGuard", "/api/auth/signup", 400, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad json",
    });

    await expectStatus(baseUrl, "crossOriginLoginGuard", "/api/auth/login", 403, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.example" },
      body: JSON.stringify({ email: "attacker@example.com", password: "CodexProd2026!" }),
    });

    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Codex Prod Smoke" },
    });
    assert(!created.error && created.data.user?.id, created.error?.message || "Auth user was not created.");
    authUserId = created.data.user.id;
    console.log("adminCreateUser=ok");

    const job = await prisma.jobListing.upsert({
      where: { source_sourceJobId: { source, sourceJobId } },
      update: {},
      create: {
        source,
        sourceJobId,
        sourceUrl: "https://example.com/applyos-smoke-job",
        title: "Software Engineer Intern",
        company: "ApplyOS Smoke Test",
        location: "Singapore",
        workMode: "hybrid",
        employmentTypeJson: JSON.stringify(["internship"]),
        seniorityJson: JSON.stringify(["student", "entry"]),
        descriptionText:
          "Build TypeScript, Next.js, Supabase, and OpenAI features for a student job application platform. Work with authentication, resume parsing, evidence matching, and production deployment checks.",
        skillsJson: JSON.stringify(["TypeScript", "Next.js", "Supabase", "OpenAI", "Prisma"]),
        rawSourceHash: `codex-${suffix}`,
      },
    });
    jobId = job.id;
    console.log("jobCreate=ok");

    const login = await api(baseUrl, cookies, "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert(login.user?.id === authUserId, "Login did not return the disposable smoke user.");
    console.log("login=ok");

    const me = await api(baseUrl, cookies, "/api/auth/me");
    assert(me.user?.id === authUserId, "Session read did not return the disposable smoke user.");
    console.log("session=ok");

    await expectStatus(
      baseUrl,
      "crossOriginProfileGuard",
      "/api/profile/demo",
      403,
      {
        method: "POST",
        headers: { origin: "https://evil.example" },
      },
      cookies,
    );

    await api(baseUrl, cookies, "/api/profile/demo", { method: "POST" });
    console.log("demoProfile=ok");

    const form = new FormData();
    form.append(
      "file",
      new Blob(
        [
          "Codex smoke resume. TypeScript, Next.js, Supabase, Prisma, OpenAI, resume parsing, authentication, deployment verification.",
        ],
        { type: "text/plain" },
      ),
      "codex-smoke-resume.txt",
    );

    const upload = await api(baseUrl, cookies, "/api/profile/resume-upload", {
      method: "POST",
      body: form,
    });
    assert(upload.file?.extractedTextAvailable === true, "Resume upload did not extract text.");
    assert(upload.file?.path, "Resume upload did not return a storage path.");
    uploadedPaths.push(upload.file.path);
    console.log("resumeUpload=ok");

    const resumes = await api(baseUrl, cookies, "/api/profile/resumes");
    const uploadedResume = (resumes.resumes || []).find((resume) => resume.fileName === "codex-smoke-resume.txt");
    assert(uploadedResume?.signedUrl, "Resume retrieval did not return a signed URL.");
    assert(uploadedResume?.extractedTextPreview, "Resume retrieval did not return an extracted text preview.");
    resumeId = uploadedResume.id;
    console.log("resumeRetrieval=ok");

    await api(baseUrl, cookies, `/api/profile/resumes?id=${encodeURIComponent(resumeId)}`, { method: "DELETE" });
    console.log("resumeDelete=ok");

    const analysis = await api(baseUrl, cookies, "/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    assert(analysis.analysis?.provider === expectedAiProvider, "Fit analysis used an unexpected AI provider.");
    assert(Number.isInteger(analysis.analysis?.overallScore), "Fit analysis did not return a score.");
    console.log(`fitAnalysis=ok provider=${analysis.analysis.provider}`);

    const application = await api(baseUrl, cookies, "/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, fitAnalysisId: analysis.analysis.id }),
    });
    const applicationId = application.application?.id;
    assert(applicationId, "Application save did not return an application id.");
    console.log("applicationSave=ok");

    const pack = await api(baseUrl, cookies, "/api/application-pack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });
    assert(pack.pack?.provider === expectedAiProvider, "Application pack used an unexpected AI provider.");
    assert((pack.pack?.resumeBullets || []).length >= 3, "Application pack returned too few resume bullets.");
    assert(pack.pack?.coverLetter, "Application pack did not return a cover letter.");
    console.log(`applicationPack=ok provider=${pack.pack.provider}`);

    const interview = await api(baseUrl, cookies, "/api/interview-prep", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });
    assert(interview.interview?.provider === expectedAiProvider, "Interview prep used an unexpected AI provider.");
    assert((interview.interview?.questions || []).length >= 6, "Interview prep returned too few questions.");
    console.log(`interviewPrep=ok provider=${interview.interview.provider}`);

    console.log("productionSmoke=ok");
  } finally {
    if (resumeId) {
      await prisma.resumeFile.deleteMany({ where: { id: resumeId } }).catch(() => null);
    }
    for (const storagePath of uploadedPaths) {
      await supabase.storage.from(bucket).remove([storagePath]).catch(() => null);
    }
    if (authUserId) {
      await prisma.user.delete({ where: { id: authUserId } }).catch(() => null);
      await supabase.auth.admin.deleteUser(authUserId).catch(() => null);
    }
    if (jobId) {
      await prisma.jobListing.delete({ where: { id: jobId } }).catch(() => null);
    }
    await prisma.$disconnect();
    console.log("cleanup=ok");
  }
}

main().catch((error) => {
  console.error(`productionSmoke=failed ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
