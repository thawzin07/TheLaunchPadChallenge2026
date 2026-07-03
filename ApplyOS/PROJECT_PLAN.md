---
title: ApplyOS Project Plan
status: active
date: 2026-07-03
deadline: 2026-07-31 23:59 SGT
---

# ApplyOS Project Plan

## Objective

Build a production-shaped ApplyOS MVP for The LaunchPad Challenge 2026.

## P0 Build Order

1. Scaffold Next.js app.
2. Add auth and protected routes.
3. Add database schema and migrations.
4. Add demo seed data.
5. Build user profile flow.
6. Build job connector layer with MyCareersFuture + mock jobs first.
7. Build job search/results and job detail.
8. Build AI provider adapter layer with mock provider first, OpenAI next.
9. Build profile normalization and requirement extraction.
10. Build fit analysis and evidence table.
11. Build application pack generation.
12. Build application tracker.
13. Build interview prep.
14. Add `.env.example`.
15. Add README and demo instructions.
16. Run verification and prepare submission artifacts.

## P0 Acceptance Criteria

- User can sign up, login, and logout.
- User can create/update profile.
- App shows Singapore-relevant jobs through live or mock connector.
- User can inspect a job.
- User can generate fit analysis.
- Evidence table links requirements to real profile evidence.
- User can generate application pack.
- User can save job to tracker and update status.
- User can generate interview prep.
- App can open original source application URL.
- App works with missing API keys in demo/mock mode.
- README and `.env.example` exist.

## P1 After P0

- Adzuna SG connector.
- Greenhouse/Lever curated connectors.
- Resume file upload.
- Better analytics dashboard.
- Agnes AI and GMI Cloud comparison mode.
- Follow-up reminder UX.

## Daily Build Rule

Build one vertical slice at a time and keep the app runnable.

If a feature needs a key or external access, implement:

- real adapter,
- mock adapter,
- clear missing-key state.

## Submission Evidence To Collect

- screenshots of job discovery,
- screenshots of fit/evidence table,
- sample tailored application pack,
- sample mock interview prep,
- API connector success/failure logs,
- latency measurements,
- comparison against generic resume tailoring prompt,
- known limitations.
