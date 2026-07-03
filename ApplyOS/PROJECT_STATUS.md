---
title: ApplyOS Project Status
status: active
last_updated: 2026-07-03
---

# ApplyOS Project Status

## Current Phase

Production MVP implementation and verification.

## Completed

- Challenge details collected in `../DetailsAboutTheLaunchPadChallenge2026/`.
- Product direction finalized as ApplyOS.
- Created `PRODUCT_DECISION.md`.
- Created `MASTER_BUILD_PROMPT.md`.
- Created `ARCHITECTURE_PLAN.md`.
- Created `API_INTEGRATION_PLAN.md`.
- Created `AUTH_SECURITY_PLAN.md`.
- Created `DATA_MODEL.md`.
- Created `PROJECT_PLAN.md`.
- Updated `UI_PROMPT.md` for ApplyOS production UI direction.
- Updated `AGENTS.md` and `MASTER_BUILD_PROMPT.md` to reference `UI_PROMPT.md`.
- Scaffolded a Next.js 16 + TypeScript + Tailwind application.
- Replaced local credentials authentication with Supabase Auth and cookie-based SSR sessions.
- Added password reset request and update flow through Supabase Auth recovery links.
- Added an env-gated signup fallback for Supabase email rate-limit incidents.
- Added shared password-strength validation for signup and password reset.
- Added same-origin checks and lightweight rate limiting for auth mutation routes.
- Added same-origin checks for state-changing profile, resume, application, analysis, application-pack, interview-prep, and logout routes.
- Added reusable production smoke verification script.
- Added GitHub Actions CI for install, Prisma client generation, typecheck, lint, build, and audit.
- Added protected app routes and a private user profile workspace.
- Added authenticated resume download route so uploaded resume files are listed, opened, and deleted only after checking the signed-in owner.
- Removed direct Supabase Storage bucket paths and signed URLs from resume upload/list API responses.
- Added toast notifications for signin, signup, signout, profile loading/saving, resume upload/delete, job fetching, fit analysis, and tailored pack generation.
- Added active sidebar navigation highlighting.
- Redesigned the private profile screen with clearer profile input, upload, and confirm/save actions.
- Reworked the Jobs screen so job details open in a modal with a close control instead of expanding down the page.
- Updated OpenAI application-pack prompts to tailor the existing resume/profile to the selected job description.
- Added an OpenAI Responses `input_file` fallback for latest uploaded resume files when local text extraction is unavailable.
- Added Prisma data models.
- Switched database configuration from local SQLite to Supabase Postgres.
- Added Supabase Storage integration for the `resumes` bucket.
- Added `ResumeFile` persistence for uploaded resume metadata, extracted text, signed retrieval, and deletion.
- Added PDF, DOCX, and TXT resume text extraction.
- Added job adapters for MyCareersFuture, Adzuna SG, Greenhouse, Lever, and mock fallback.
- Added AI adapters for OpenAI, Agnes AI compatible endpoint, GMI Cloud compatible endpoint, and deterministic mock fallback.
- Added normalized API error handling for protected routes.
- Added fit analysis, evidence matching, application pack generation, tracker, interview prep, and API health routes.
- Built production UI screens for Dashboard, Profile, Jobs, Applications, Interview Prep, and Settings.
- Added `.env.example` and updated `README.md`.
- Added root repository README and root `.gitignore`.
- Created GitHub repository `thawzin07/TheLaunchPadChallenge2026`.
- Created and connected Vercel project `thawzin07s-projects/applyos`.
- Added an npm override so Next's nested PostCSS dependency resolves to the fixed `8.5.16` release.

## Current Decision

Build ApplyOS as a production-shaped web app with authentication, private user profiles, Singapore job discovery, evidence-based fit analysis, tailored application packs, application tracking, and interview prep.

## Current Implementation Choice

- Auth: Supabase Auth with protected Next.js routes, SSR cookies, and normalized `401` API responses.
- Signup: normal Supabase email-confirmation flow first, with `AUTH_ALLOW_UNVERIFIED_SIGNUP_FALLBACK` available for demo continuity while Supabase email limits are active.
- Database: Prisma + Supabase Postgres.
- AI: OpenAI is configured for live tailoring in local `.env`; mock mode remains available through `.env.example`.
- Jobs: live connector attempts first, then cached/local/mock fallback.
- Resumes: private Supabase Storage objects plus `ResumeFile` records and extracted text in the user profile.

## Verification

Completed before Supabase switch on 2026-07-03:

- `npm run db:generate` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Dev server started on `http://localhost:3000`.
- Authenticated smoke test passed:
  - signup,
  - demo profile load,
  - job discovery,
  - fit analysis,
  - application save,
  - application pack generation,
  - interview prep generation,
  - API health check.
- HTTP page-render check passed for `/login`.
- Unauthenticated `/dashboard` returned redirect as expected.

Known local notes:

- Supabase credentials are required before live database routes can run.
- `npm run db:bootstrap` was removed after switching to Supabase Postgres.
- Direct database host resolves to IPv6 only from this machine, so use Supabase pooler URLs from the dashboard Connect panel.

Supabase switch verification on 2026-07-03:

- `npm run db:generate` passed.
- `npx prisma validate` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run db:push` passed using the working Supabase pooler host.
- Removed obsolete local `prisma/dev.db`.
- Resume upload route added at `/api/profile/resume-upload`.
- Supabase Auth project URL and publishable key configured.
- Supabase plugin migration created the public ApplyOS app tables.
- Supabase Auth signup route reached the Auth service, but signup testing hit `email rate limit exceeded`.
- Added `/auth/confirm` for Supabase email confirmation callback.
- Supabase RLS is enabled on all public ApplyOS app tables with authenticated ownership policies.
- Verified `/login` returns 200 and unauthenticated `/dashboard` redirects to `/login`.
- Verified the Supabase `resumes` bucket exists and is private.

Resume and AI hardening verification on 2026-07-03:

- `npx prisma db push` passed after adding `ResumeFile` and new application indexes.
- Verified `ResumeFile` has RLS enabled with an authenticated ownership policy.
- Verified the private Supabase `resumes` bucket through the service-role key.
- Verified OpenAI Responses API access with the configured `OPENAI_MODEL`.
- `npx tsc --noEmit` passed.
- `npm run lint` passed.
- Verified `/login` returns 200 in a headless browser with no console errors or Next.js error overlay.
- Verified unauthenticated `/api/profile` and `/api/profile/resumes` return `401`.

Deployment verification on 2026-07-03:

- GitHub remote: `https://github.com/thawzin07/TheLaunchPadChallenge2026`.
- Vercel production URL: `https://applyos-sable.vercel.app`.
- Vercel project root directory set to `ApplyOS`.
- Vercel production environment variables configured for Supabase and OpenAI.
- Live `/login` returned `200`.
- Live `/api/health` returned `200` and reported Supabase Postgres ready.
- Live unauthenticated `/api/profile` returned `401`.
- First Git-triggered production deployment from `main` reached `Ready` and the production alias moved to it.
- Password reset deployment verification:
  - live `/forgot-password` returned `200`,
  - invalid reset request returns `400`,
  - unauthenticated reset update returns `401`,
  - authenticated reset update returns `200`,
  - login with the updated password returns `200`,
  - test auth user cleanup passed.
- Public signup verification while Supabase email rate limit was active:
  - live `/api/auth/signup` returned `200`,
  - `emailConfirmationBypassed` was `true`,
  - session cookie was issued,
  - app user and auth user cleanup passed.
- Production authenticated E2E smoke passed with a disposable confirmed user:
  - login/session read,
  - demo profile load,
  - TXT resume upload, signed retrieval, extracted text preview, and delete,
  - OpenAI fit analysis,
  - application save,
  - OpenAI application pack,
  - OpenAI interview prep,
  - auth/app/storage cleanup.
- Auth hardening verification:
  - `npm audit --audit-level=moderate` passed with 0 vulnerabilities,
  - local production `next start` probe rejects common weak signup passwords with `400`,
  - local production `next start` probe rejects cross-origin auth POSTs with `403`,
  - malformed auth JSON returns `400` instead of a generic server error.
- Post-hardening production verification:
  - deployed commit `8cf730b` to Vercel deployment `dpl_4JAZHVZpCmZdrXLouutiXNFbGMGe`,
  - production alias `https://applyos-sable.vercel.app` moved to the new deployment,
  - live `/api/health` returned `200` with Supabase Postgres, Storage, and OpenAI configured,
  - live auth hardening probes returned weak signup `400`, cross-origin login `403`, and malformed signup JSON `400`,
  - live authenticated smoke with a disposable confirmed user passed login/session, demo profile, TXT resume upload/retrieval, OpenAI fit analysis, application save, OpenAI application pack, OpenAI interview prep, and cleanup.
- Signup-rate-limit follow-up verification:
  - deployed commit `0c4d927` to Vercel deployment `dpl_7QKQpzpS5s1y7d3GQLfiBHPs9G7o`,
  - live signup under Supabase email-rate-limit conditions returned `200` with `emailConfirmationBypassed: true`,
  - `npm run smoke:production` passed against `https://applyos-sable.vercel.app`.
- CI verification:
  - with local `.env` and `.env.local` hidden, `npm ci`, `npm run db:generate`, and `npm run verify` passed.
- Resume ownership and UX verification:
  - `npx.cmd tsc --noEmit --pretty false` passed,
  - `npx.cmd eslint` passed,
  - `npx.cmd next build` passed,
  - `npm.cmd audit --audit-level=moderate` passed with 0 vulnerabilities,
  - local production server on `http://localhost:3102` rendered `/login`, `/profile`, and `/jobs` with no framework error overlay or console errors in Playwright,
  - browser login with a disposable confirmed user redirected to `/dashboard`,
  - `/profile` showed `Private Profile`, `Confirm and save`, and `Upload selected resume`, with no `Supabase Storage bucket` user-facing copy,
  - `/profile` and `/jobs` sidebar items received `aria-current="page"` when viewed,
  - `/jobs` loaded job rows and opened job details in a modal with `Analyze fit`, `Tailor resume`, and a close control,
  - resume access-control probe passed: owner download returned `200`, another signed-in user received `404` for download and delete, and owner delete succeeded.
  - local `OPENAI_MODEL=codex 5.3 codex spark` caused OpenAI to fall back because it is not a valid API model id,
  - direct OpenAI probe for the official Codex Spark slug `gpt-5.3-codex-spark` returned `model_not_found` for this API key,
  - local `.env` was corrected to `OPENAI_MODEL=gpt-5.5`,
  - local `SMOKE_BASE_URL=http://localhost:3102 SMOKE_EXPECT_AI_PROVIDER=openai node scripts/production-smoke.mjs` passed, including authenticated resume upload/download/delete, OpenAI fit analysis, OpenAI application pack, OpenAI interview prep, and cleanup.

## Risks

| Risk | Mitigation |
|---|---|
| Job APIs are unstable or gated | Use connector adapters, cache, mock fallback, manual import |
| Product becomes a generic resume generator | Make evidence matching and tracker the core |
| User data privacy risk | Server-side APIs, protected routes, per-user authorization |
| Too much scope | Build P0 vertical slice first |
| UI scope grows too wide | Keep the 3-minute demo path and P0 workflow as the build priority |

## Next

- Run a full authenticated browser smoke test with a fresh signup/login once Supabase email limits are clear.
- Confirm Supabase Auth production redirect URLs include `https://applyos-sable.vercel.app/auth/confirm`.
- Enable Supabase leaked password protection in the Auth dashboard.
- Disable `AUTH_ALLOW_UNVERIFIED_SIGNUP_FALLBACK` after custom SMTP or normal Supabase email delivery is configured.
- Add a custom domain if the project needs one for judging/demo polish.
