---
title: ApplyOS API Integration Plan
status: active
date: 2026-07-03
---

# ApplyOS API Integration Plan

## API Strategy

Integrate APIs through adapters. Do not wire external APIs directly into UI components.

Use two adapter families:

1. Job source connectors.
2. AI provider connectors.

## P0 Job Sources

### MyCareersFuture

Purpose: Singapore-first job discovery.

Status:

- Live endpoint has been tested and returned Singapore job JSON.
- Endpoint appears usable but should be treated as undocumented unless official developer docs are confirmed.

Implementation:

- Server-side connector only.
- Query search terms, employment type, seniority, and limit.
- Normalize HTML job descriptions into clean text.
- Preserve original job URL for user application.
- Cache results.
- Gracefully fall back on failure.

Risk:

- Endpoint behavior or access may change.
- Need avoid aggressive polling.

### Adzuna SG

Purpose: official job API fallback and broader aggregator.

Status:

- Official REST API exists.
- Requires `app_id` and `app_key`.
- Use country route `sg`.

Implementation:

- Server-side connector.
- Query by keywords, location, salary, category where supported.
- Normalize to shared job schema.

### Manual Import

Purpose: reliable fallback for LinkedIn, JobStreet, Indeed, company pages, and unsupported links.

Implementation:

- User pastes job URL and/or job description.
- App extracts requirements from pasted text.
- User applies manually on source site.

## P1 Job Sources

### Greenhouse

Purpose: public company career-board jobs.

Status:

- Public GET endpoints do not require auth for job-board data.
- Requires known board token/company handle.

Implementation:

- Maintain curated list of company board tokens.
- Fetch `jobs?content=true`.
- Filter Singapore, remote, internship, junior, software, data, AI roles.

### Lever

Purpose: public company career-board jobs.

Status:

- Public postings endpoints are usually accessible per company handle.

Implementation:

- Maintain curated company handles.
- Normalize postings to shared schema.

## P2 Or Partner-Gated Sources

### LinkedIn

Use only official/allowed routes:

- no mass scraping,
- no user credential storage,
- manual import or future partner integration only.

### JobStreet

No clean public API is assumed for MVP.

Use:

- manual import,
- browser/manual copy fallback,
- future connector only if a compliant API route is available.

### Indeed

Partner docs exist, but access may be provisioned.

Use:

- disabled optional connector unless credentials/access are available,
- manual import fallback.

## AI Provider Integrations

### OpenAI

Purpose:

- primary extraction, matching, tailoring, and interview-prep provider.

Use for:

- structured profile parsing,
- job requirement extraction,
- fit scoring,
- evidence matching,
- application pack generation,
- interview questions and feedback.

### Agnes AI

Purpose:

- sponsor-aligned model adapter and optional comparison path.

Use for:

- alternative generation,
- comparison mode,
- Best Use of Agnes AI eligibility if feasible.

Implementation:

- OpenAI-compatible adapter if Agnes endpoint supports it.
- Disable gracefully if no key/base URL/model.

### GMI Cloud

Purpose:

- sponsor-aligned hosted/open-source model path.

Use for:

- model comparison,
- batch evaluation,
- optional lower-cost or open-source provider.

Implementation:

- OpenAI-compatible adapter if available.
- Disable gracefully if no key/base URL/model.

## Environment Variables

Create `.env.example` during implementation with:

```env
# App
NEXT_PUBLIC_APP_NAME=ApplyOS
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Auth
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Database
DATABASE_URL=
DIRECT_URL=

# Storage
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=resumes

# AI Routing
AI_PRIMARY_PROVIDER=openai
AI_ENABLE_PROVIDER_COMPARISON=false
AI_MOCK_MODE=true
AI_TIMEOUT_MS=60000
AI_MAX_RETRIES=2

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=

# Agnes AI
AGNES_API_KEY=
AGNES_API_BASE_URL=
AGNES_MODEL=

# GMI Cloud
GMI_API_KEY=
GMI_API_BASE_URL=
GMI_MODEL=

# Jobs - Adzuna
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
ADZUNA_COUNTRY=sg

# Jobs - Optional
GREENHOUSE_BOARD_TOKENS=
LEVER_COMPANY_HANDLES=
INDEED_API_KEY=
```

## Internal Job Schema

Every source should normalize to:

```ts
type JobListing = {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  company: string;
  location?: string;
  workMode?: "onsite" | "hybrid" | "remote" | "unknown";
  employmentType?: string[];
  seniority?: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  postedAt?: string;
  expiresAt?: string;
  descriptionText: string;
  skills?: string[];
  raw?: unknown;
};
```

## Source Priority For Demo

1. MyCareersFuture live connector.
2. Mock Singapore jobs.
3. Adzuna SG if keys are present.
4. Manual import.
5. Greenhouse/Lever curated sources.
