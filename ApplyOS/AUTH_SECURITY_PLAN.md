---
title: ApplyOS Auth And Security Plan
status: active
date: 2026-07-03
---

# ApplyOS Auth And Security Plan

## Auth Requirement

The app must support:

- sign up,
- login,
- logout,
- protected dashboard routes,
- per-user data isolation.

## Recommended Auth

Preferred for fastest production-shaped MVP:

1. **Clerk** if quick polished auth is acceptable.
2. **NextAuth/Auth.js** if avoiding external auth vendor is preferred.
3. **Supabase Auth** if using Supabase database/storage heavily.

Pick one during implementation. Do not implement multiple auth systems.

## User Data Sensitivity

ApplyOS handles sensitive career data:

- resume/CV,
- education,
- work history,
- projects,
- skills,
- interview notes,
- application outcomes.

Treat this as private user data.

## Security Rules

- Never expose service-role keys to the browser.
- Run all job and AI API calls server-side.
- Store only normalized job data and user-approved generated artifacts.
- Never store third-party job-board login credentials.
- Do not auto-submit applications.
- Validate all AI outputs before saving.
- Escape or sanitize HTML from job descriptions before rendering.
- Keep raw external API payloads server-side or remove them unless needed for debugging.

## Privacy UX Requirements

User should be able to:

- see what profile information is stored,
- edit profile information,
- delete saved jobs,
- delete generated application packs,
- understand that generated materials may be sent to AI providers.

## Auth Route Plan

Suggested pages:

- `/sign-up`
- `/login`
- `/dashboard`
- `/profile`
- `/jobs`
- `/jobs/[id]`
- `/applications`
- `/applications/[id]`
- `/interview/[applicationId]`

Protected:

- all dashboard/profile/jobs saved/application/interview routes.

Public:

- landing or login page,
- auth callbacks,
- health check.

## Authorization Rules

- User can only access their own profile.
- User can only access their own applications.
- User can only access their own generated materials.
- Job listings can be shared/cached globally if they contain public source data.
- Fit analyses and application packs are user-specific.

## AI Privacy Rules

Before sending user profile data to an AI provider:

- include only necessary fields,
- do not send auth identifiers,
- avoid sending full raw resume if a normalized evidence profile is enough,
- log provider/model/latency but not sensitive prompt body unless debugging locally.

## Demo Mode

Demo mode should include:

- sample student profile,
- sample jobs,
- sample generated application pack,
- clear label that sample data is fictional or demo data.

Demo mode must not require real personal data.
