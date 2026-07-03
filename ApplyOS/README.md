# ApplyOS

ApplyOS is a production-shaped internship/job application workspace for The LaunchPad Challenge 2026. It is built for students, fresh graduates, and job applicants who need more than another job board: private profile storage, Singapore job discovery, evidence-backed fit analysis, tailored application materials, application tracking, and interview prep.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, lucide-react
- Prisma with Supabase Postgres persistence
- Supabase Auth with cookie-based SSR sessions and protected routes
- Email/password signup, login, logout, confirmation callback, and password reset recovery
- Supabase Storage private resume uploads with database-backed file records and signed retrieval links
- PDF, DOCX, and TXT resume text extraction
- Job adapters: MyCareersFuture, Adzuna SG, Greenhouse, Lever, mock fallback
- AI adapters: OpenAI Responses API, Agnes AI compatible endpoint, GMI Cloud compatible endpoint, deterministic mock fallback

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Open `http://localhost:3000`.

Before `npm run db:push`, replace the Supabase placeholders in `.env` with your real Supabase Postgres URLs.

## Demo Flow

1. Create an account or sign in.
2. Use password reset from the login screen if you need account recovery.
3. Go to Profile, load the demo profile, or upload a PDF, DOCX, or TXT resume.
4. Review uploaded resumes, open signed links, and delete files when needed.
5. Go to Jobs and search for a Singapore internship role.
6. Select a role, run fit analysis, save it, and generate an application pack.
7. Review and copy tailored bullets, a resume draft, a cover letter, and recruiter message.
8. Go to Applications to track status and copy saved materials.
9. Go to Interview Prep and generate role-specific questions.
10. Go to Settings to show API health and configured/missing providers.

## Environment

Use `.env.example` as the template. The app is usable with mock mode and no paid keys. Set `AI_MOCK_MODE=false` only after adding at least one configured AI provider.

Important variables:

- `AUTH_ALLOW_UNVERIFIED_SIGNUP_FALLBACK`
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `AI_PRIMARY_PROVIDER`
- `AI_MOCK_MODE`
- `OPENAI_API_KEY`
- `AGNES_API_KEY`, `AGNES_API_BASE_URL`, `AGNES_MODEL`
- `GMI_API_KEY`, `GMI_API_BASE_URL`, `GMI_MODEL`
- `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`
- `GREENHOUSE_BOARD_TOKENS`
- `LEVER_COMPANY_HANDLES`

## Verification

```bash
npm run db:generate
npm run db:push
npm run verify
```

Production smoke test:

```bash
npm run smoke:production
```

The smoke test creates a disposable confirmed Supabase Auth user and a disposable smoke job, signs in through the live app, uploads/retrieves/deletes a TXT resume, runs OpenAI fit analysis, saves an application, generates an application pack and interview prep, verifies key origin/password guards, then cleans up the auth user, app rows, and storage object. Set `SMOKE_BASE_URL` to test a non-production deployment and `SMOKE_EXPECT_AI_PROVIDER` if the primary AI provider changes.

## Supabase Database URLs

Use the Supabase Transaction pooler URL for `DATABASE_URL` and the Session pooler URL for `DIRECT_URL`.

```env
DATABASE_URL="postgresql://postgres.your-project-ref:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.your-project-ref:password@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

ApplyOS uses Supabase Auth for signup, login, logout, and route protection. The `public.User` table stores app-specific profile ownership metadata keyed by the Supabase Auth user id.

The `resumes` bucket is used by the Profile screen's resume upload control. Uploads are server-side and require `SUPABASE_SERVICE_ROLE_KEY`.

## Security Note

The app accesses app tables through server-side Prisma and uses route-level ownership checks. Keep Row Level Security enabled for tables that may later be accessed directly through browser Supabase clients, and keep the `SUPABASE_SERVICE_ROLE_KEY` server-only.

`AUTH_ALLOW_UNVERIFIED_SIGNUP_FALLBACK=true` is a demo safety valve for Supabase email rate limits. It creates a confirmed Supabase Auth user server-side only when Supabase rejects signup with an email rate-limit error. Disable it after configuring custom SMTP or restoring normal email confirmation delivery.

Auth mutation routes enforce same-origin checks, lightweight per-client throttling, shared password-strength validation, and `400` responses for malformed JSON. Supabase Auth leaked-password protection should still be enabled in the Supabase dashboard when available.

The project uses an npm `overrides` entry to force transitive `postcss` resolution to `8.5.16`, avoiding the vulnerable nested version pinned by the current Next.js release.
