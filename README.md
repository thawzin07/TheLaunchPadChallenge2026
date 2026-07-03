# The LaunchPad Challenge 2026

This workspace contains ApplyOS, the LaunchPad Challenge 2026 product build, plus the source challenge notes used to shape the product.

## Folders

- `ApplyOS/` - Next.js app for authenticated job discovery, resume storage, AI tailoring, application tracking, and interview prep.
- `DetailsAboutTheLaunchPadChallenge2026/` - event overview, judging notes, and challenge background.

## Run ApplyOS

```bash
cd ApplyOS
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open `http://localhost:3000`.

Copy `ApplyOS/.env.example` to `ApplyOS/.env` and fill the Supabase, OpenAI, and optional job-provider values before running live services.

