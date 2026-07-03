---
title: ApplyOS Architecture Plan
status: active
date: 2026-07-03
---

# ApplyOS Architecture Plan

## Recommended Stack

Use this stack for the production-shaped MVP:

| Layer | Decision |
|---|---|
| Framework | Next.js App Router + TypeScript |
| UI | User-provided UI prompt later; likely Tailwind + shadcn/ui + lucide-react |
| Auth | NextAuth/Auth.js or Clerk depending implementation preference |
| Database | PostgreSQL via Supabase or Neon |
| ORM | Prisma or Drizzle |
| File storage | Supabase Storage or Vercel Blob for resume uploads |
| AI providers | OpenAI primary, Agnes AI optional, GMI Cloud optional, mock fallback |
| Job connectors | MyCareersFuture, Adzuna SG, Greenhouse, Lever, manual import |
| Deployment | Vercel |
| Validation | Zod |
| Background jobs | Simple API route/manual refresh for MVP; queue later if needed |

## Architecture Shape

Use a modular app:

```text
app/
  (auth)/
  (dashboard)/
  api/
    ai/
    jobs/
    applications/
    profile/
lib/
  ai/
    providers/
    pipelines/
    schemas/
  jobs/
    connectors/
    normalizers/
  db/
  auth/
  security/
  export/
```

## Core Domains

### User Profile

Stores the applicant's private materials:

- resume/CV text,
- education,
- projects,
- skills,
- experience,
- preferences,
- generated evidence profile.

### Job Discovery

Fetches jobs from source connectors and normalizes them to one internal schema.

### Fit Analysis

Compares a normalized job against the user's evidence profile.

### Application Pack

Generates tailored resume bullets, cover letter, recruiter message, keywords, and claims to avoid.

### Application Tracker

Tracks job status, generated materials, follow-up dates, interview prep, notes, and outcomes.

### Interview Prep

Generates role-specific technical and behavioral questions, answer outlines, and gap questions.

## Connector Rules

Each external connector must:

- run server-side only,
- have timeout and retry limits,
- normalize to a shared `JobListing` schema,
- record source and fetched timestamp,
- degrade to cached/mock data on failure,
- avoid storing third-party credentials unless explicitly supported.

## AI Rules

Each AI pipeline stage must:

- use structured outputs,
- validate with Zod,
- cite which user evidence supports each generated claim,
- mark unsupported claims clearly,
- never fabricate credentials, employment history, degrees, certifications, metrics, or links.

## Mock Mode

Mock mode is required for demo reliability.

When API keys are missing or external APIs fail:

- show sample jobs,
- use deterministic profile/job analysis,
- allow application pack generation from fixture data,
- clearly label mock/demo data.

## Deployment Model

Initial production-shaped deployment:

- Vercel web app.
- Supabase or Neon Postgres.
- Storage for uploaded resume files.
- Environment variables for all providers.

## Performance Targets

P0 targets:

- dashboard load under 2 seconds after auth,
- job search response under 5 seconds for cached/mock sources,
- AI analysis under 60 seconds,
- clear loading and retry states.

## Reliability Targets

- App works with no external AI key in mock mode.
- App works with no job API key using MyCareersFuture/mock/manual fixtures.
- Connector failure does not crash the dashboard.
- User data is not exposed across accounts.
