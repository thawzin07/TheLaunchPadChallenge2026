# AGENTS.md

## Project

This repository is for **ApplyOS**, a LaunchPad Challenge 2026 submission.

ApplyOS is an AI internship and entry-level job application operating system for students and fresh graduates in Singapore.

## Source Of Truth

Before implementation, read:

1. `PRODUCT_DECISION.md`
2. `MASTER_BUILD_PROMPT.md`
3. `ARCHITECTURE_PLAN.md`
4. `API_INTEGRATION_PLAN.md`
5. `AUTH_SECURITY_PLAN.md`
6. `DATA_MODEL.md`
7. `PROJECT_PLAN.md`
8. `PROJECT_STATUS.md`
9. `UI_PROMPT.md`
10. `../DetailsAboutTheLaunchPadChallenge2026/README.md`
11. `../DetailsAboutTheLaunchPadChallenge2026/Judging.md`

## Current Build Rule

Do not scaffold or build the app until the user explicitly starts an implementation run.

Planning and documentation updates are allowed.

## Product Rules

- ApplyOS is not a job portal replacement; it is an application strategy layer.
- The core value is evidence-based fit, tailored applications, tracking, and interview prep.
- Do not auto-submit applications in MVP.
- Do not store third-party job-board credentials.
- Do not scrape LinkedIn, JobStreet, or Indeed at scale.
- Do not invent user experience, skills, certifications, degrees, employment, metrics, or links.
- Generated application materials must distinguish real evidence from gaps.

## Engineering Rules

- Use adapters for external APIs.
- Server-side only for AI providers and job APIs.
- Validate AI outputs with schemas before saving or rendering.
- Sanitize job-description HTML before rendering.
- Keep mock mode working at all times.
- Handle missing API keys gracefully.
- Keep external-service failures from breaking the core demo.

## Auth And Data Rules

- Auth is required for real user profile and tracker data.
- User data must be isolated per account.
- Never expose service-role keys to the browser.
- Avoid logging sensitive resume/profile prompt content.
- Store API telemetry without sensitive payloads.

## Verification Rules

After implementation begins, expected checks include:

- install succeeds,
- lint passes,
- typecheck passes,
- build succeeds,
- auth flow works,
- protected routes are protected,
- mock demo works without external keys,
- at least one job connector works or fails gracefully,
- fit analysis and application pack generation work,
- tracker saves and updates status.

If a check cannot run, update `PROJECT_STATUS.md` with the reason.

## Status Tracking

Update `PROJECT_STATUS.md` after each meaningful work block with:

- completed work,
- current phase,
- next step,
- commands run,
- verification result,
- blockers or risks.
