---
title: ApplyOS Master Build Prompt
status: source-of-truth
date: 2026-07-03
---

# ApplyOS Master Build Prompt

## Mission

Build a production-shaped MVP of ApplyOS for The LaunchPad Challenge 2026.

ApplyOS is an AI internship and job application operating system for students and fresh graduates in Singapore. It helps users discover jobs, evaluate fit, tailor applications with real evidence, track applications, and prepare for interviews.

## Product Principle

The system must help users apply better without inventing or exaggerating credentials.

## Required P0 Scope

Build these end-to-end:

1. Authentication: sign up, login, logout, protected app routes.
2. User profile: resume/CV, education, skills, projects, experience, preferences.
3. Job discovery: fetch jobs from supported sources and show ranked results.
4. Job detail: show extracted requirements and original source link.
5. Fit analysis: score match between user profile and job.
6. Evidence table: requirement -> user proof -> confidence -> warning/action.
7. Application pack: tailored resume bullets, cover letter, recruiter message, keywords, claims to avoid.
8. Tracker: save job, prepare, applied, follow-up, interview, offer/rejected/archive.
9. Interview prep: mock questions and answer guidance based on user evidence.
10. API health/fallback states: source availability, mock fixtures, and missing-key handling.

## Required P1 Scope

Do only after P0 works:

- File upload parsing for resume/CV.
- Application analytics dashboard.
- Follow-up reminder suggestions.
- Provider comparison using OpenAI, Agnes AI, and GMI Cloud.
- Greenhouse/Lever curated-company job discovery.

## Out Of Scope For MVP

- Auto-submit job applications.
- Store LinkedIn, JobStreet, Indeed, or MyCareersFuture login credentials.
- Browser automation for logged-in job portals.
- Payment features.
- Team collaboration.
- Mobile native app.
- AI video interview with voice.

## AI Workflow

Use a multi-step AI pipeline:

1. **Profile Normalizer**: convert resume/profile into structured user evidence.
2. **Job Requirement Extractor**: extract skills, responsibilities, seniority, experience, qualifications, and keywords from each job.
3. **Fit Scorer**: compare job requirements to user evidence.
4. **Evidence Matcher**: build requirement/evidence/confidence table.
5. **Application Tailor**: generate tailored resume bullets and cover letter from real evidence only.
6. **Interview Coach**: generate role-specific mock questions and answer guidance.

Each stage should use schema-validated outputs.

## AI Provider Strategy

Use provider adapters:

- OpenAI: primary reasoning and writing provider.
- Agnes AI: optional sponsor model adapter if credentials are available.
- GMI Cloud: optional open-source/serverless model adapter if credentials are available.
- Mock provider: deterministic demo fallback.

The app must run without API keys in mock mode.

## Job Source Strategy

Use connector adapters:

- MyCareersFuture: Singapore-first source.
- Adzuna SG: official API source requiring app credentials.
- Greenhouse: public job-board API per company board token.
- Lever: public postings API per company handle.
- Manual import: URL/paste fallback for LinkedIn, JobStreet, Indeed, and unsupported company pages.

Every connector must fail gracefully and not break the demo.

## Required Demo Story

Final demo should show:

1. User signs in.
2. User profile/resume is already loaded or created quickly.
3. App fetches Singapore jobs.
4. User opens one role.
5. App shows fit score and evidence match.
6. User generates application pack.
7. User saves job to tracker.
8. User generates interview prep.
9. User clicks source-site apply link.

## UI Status

Use `UI_PROMPT.md` as the source of truth for the app interface, interaction states, responsive behavior, and demo path.

## Definition Of Done

P0 is complete when:

- auth works,
- user profile can be saved,
- at least one real job connector works or falls back cleanly,
- job search results render,
- fit analysis runs,
- application pack is generated,
- tracker state is persisted,
- interview prep is generated,
- app works in mock mode,
- `.env.example` documents all required and optional keys,
- README explains setup, connectors, mock mode, and demo flow.
