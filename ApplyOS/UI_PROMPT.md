---
title: ApplyOS UI Prompt
status: source-of-truth
date: 2026-07-03
---

# ApplyOS UI Prompt

## Role

Design and build the ApplyOS interface as a production-ready SaaS web app for students and fresh graduates managing internship and entry-level job applications in Singapore.

ApplyOS is not a generic job board and not a generic resume generator. It is an application operating system: job discovery, fit analysis, evidence-backed tailoring, application tracking, and interview preparation in one workflow.

## Visual Direction

Use a disciplined, minimalist product style: quiet, precise, structured, and professional.

The app should feel like a serious career cockpit for repeated daily use. It should be calm and polished, but not empty or decorative. Prioritize scanability, evidence, status, and clear next actions.

Use:

- clean white or near-white surfaces,
- dark readable text,
- restrained neutral borders,
- one primary accent color,
- subtle status colors,
- compact spacing,
- crisp table/list layouts,
- strong typography hierarchy,
- icons where they improve recognition.

Avoid:

- marketing landing-page composition as the main screen,
- oversized hero sections,
- decorative gradients,
- gradient orbs,
- bokeh blobs,
- cartoon illustrations,
- nested cards,
- excessive shadows,
- vague AI-chatbot styling,
- UI that feels like a resume template generator only.

## Product Navigation

Use a protected app shell after login.

Primary navigation:

- Dashboard
- Profile
- Jobs
- Applications
- Interview Prep
- Settings

Secondary utility:

- API status
- Mock mode indicator
- User/account menu
- Logout

## Public/Auth Screens

### Login

Professional split-free auth screen, not a marketing hero.

Required:

- app name and concise value statement,
- email/password or provider login area depending auth implementation,
- link to sign up,
- clear error states,
- loading state.

### Sign Up

Required:

- email/password or provider sign-up area,
- short note that resume/profile data remains private,
- link to login,
- clear validation errors.

## Onboarding/Profile Flow

The first authenticated experience should guide the user to build a useful applicant profile quickly.

Required sections:

- Resume/CV input or upload placeholder.
- Education.
- Skills.
- Projects.
- Work experience.
- Coursework.
- Certifications.
- Preferences:
  - role type,
  - location,
  - remote/hybrid/onsite,
  - salary range,
  - industries,
  - internship/full-time/contract.

UX rules:

- Show profile completeness.
- Let the user save progress.
- Provide a sample/demo profile button.
- Do not block demo mode if the profile is incomplete.
- Clearly distinguish user-provided evidence from AI-inferred evidence.

## Dashboard

The dashboard should be the working home screen, not a landing page.

Show:

- profile readiness,
- saved jobs,
- applications by status,
- upcoming follow-ups,
- upcoming interviews,
- top missing skills,
- recent AI-generated application packs,
- source/API health.

Primary actions:

- Find jobs
- Update profile
- Review applications
- Practice interview

## Jobs View

Purpose: discover Singapore-relevant internships and entry-level jobs, then rank them by profile fit.

Required UI:

- search input,
- source filter:
  - MyCareersFuture,
  - Adzuna SG,
  - Greenhouse,
  - Lever,
  - Manual import,
  - Mock/demo data,
- role type filters,
- location/work-mode filters,
- seniority/experience filters,
- salary filter where available,
- refresh/fetch button,
- connector status indicator.

Job cards or table rows must show:

- title,
- company,
- source,
- location,
- employment type,
- salary if available,
- posted/expiry date if available,
- fit score,
- top match reason,
- top gap,
- source apply link.

Use dense but readable rows on desktop. Collapse into compact stacked cards on mobile.

## Job Detail View

Purpose: make one role understandable and actionable.

Required sections:

- job summary,
- original source link,
- requirements extracted by AI,
- responsibilities,
- qualifications,
- skills,
- salary/location metadata,
- source freshness,
- raw description toggle.

Primary actions:

- Analyze fit
- Prepare application
- Save to tracker
- Apply on source site

Important: "Apply on source site" opens the original job page. The app must not imply auto-submit.

## Fit Analysis View

This is one of the most important screens.

Show:

- overall fit score,
- confidence level,
- short fit summary,
- matched strengths,
- gaps,
- risk warnings,
- recommended strategy.

Evidence table columns:

- Job requirement
- User evidence
- Evidence source
- Confidence
- Gap or warning
- Recommended action

Confidence/status colors:

- strong match: green,
- partial match: amber,
- gap: red,
- unsupported claim: rose,
- needs review: blue/neutral.

The table must make unsupported claims obvious. Do not hide gaps behind positive language.

## Application Pack View

Purpose: help the user prepare materials before manually applying.

Required tabs:

- Resume bullets
- CV/resume draft
- Cover letter
- Recruiter message
- Keywords
- Claims to avoid

Each generated item must show:

- what job requirement it addresses,
- which user evidence supports it,
- whether it is safe to claim,
- edit/copy controls.

Primary actions:

- Save application pack
- Copy section
- Export markdown
- Save job to tracker
- Apply on source site

UX rule: generated text should be editable and reviewable. Do not present it as final truth.

## Application Tracker

Purpose: give the user a clear pipeline across many applications.

Support statuses:

- Saved
- Preparing
- Applied
- Follow-up Due
- Interview Scheduled
- Interview Done
- Offer
- Rejected
- Archived

Recommended UI:

- Kanban board for desktop,
- table/list toggle,
- compact list on mobile.

Application item should show:

- job title,
- company,
- source,
- status,
- fit score,
- application date,
- follow-up due date,
- interview date,
- application pack status,
- notes indicator.

Actions:

- change status,
- open application pack,
- prepare interview,
- draft follow-up,
- add note,
- open source job.

## Interview Prep View

Purpose: prepare the user for a specific role using the job description and their real evidence.

Required sections:

- technical questions,
- behavioral questions,
- role/company questions,
- gap questions,
- suggested answer points,
- evidence to mention,
- weak areas to prepare.

Optional interaction:

- practice mode with one question at a time,
- user answer text area,
- AI feedback after answer,
- save interview notes.

Do not require voice or video for MVP.

## Settings/API Health

Production-ready app needs clear integration health.

Show:

- auth status,
- database status,
- mock mode status,
- OpenAI provider status,
- Agnes AI provider status,
- GMI Cloud provider status,
- MyCareersFuture connector status,
- Adzuna connector status,
- Greenhouse connector status,
- Lever connector status.

Missing API keys should not crash the app. Show a clear disabled/missing-key state and keep mock mode available.

## Empty, Loading, Error, And Fallback States

Every major screen needs professional states:

- empty profile,
- no jobs found,
- connector failed,
- missing API key,
- AI generation failed,
- auth required,
- protected data unavailable,
- offline or retry state,
- mock mode fallback.

Use plain, useful messages and direct actions. Avoid cute copy.

## Data Privacy UX

Because the app handles resumes and personal data, UI should visibly respect privacy.

Include:

- private profile indicator,
- short explanation before sending profile/job data to AI,
- delete controls for saved application packs,
- no third-party credential collection,
- warning that applications are submitted manually on source sites.

## Responsive Requirements

Desktop:

- full app shell,
- sidebar navigation,
- dense tables,
- split views where useful.

Tablet:

- collapsible sidebar,
- readable two-column layouts where space allows.

Mobile:

- bottom or compact navigation,
- stacked sections,
- table rows convert to cards,
- all buttons and text must fit without overlap.

## Component Expectations

Use familiar product components:

- nav sidebar,
- command/search input,
- filter bar,
- segmented controls,
- status badges,
- tables,
- kanban board,
- tabs,
- drawers or modals for focused edits,
- toast notifications,
- progress indicators,
- copy buttons,
- external-link buttons,
- empty states.

Use icon buttons with tooltips where appropriate.

## Demo Path

The UI must support this final 3-minute demo:

1. Sign in.
2. Load demo student profile.
3. Fetch or load Singapore jobs.
4. Open a software/internship role.
5. Show fit score and evidence table.
6. Generate application pack.
7. Save to tracker.
8. Generate interview prep.
9. Open source apply link.

Keep this path visually clear and reliable.

## Production Quality Bar

The final interface should feel ready for a serious public demo:

- no broken layouts,
- no overlapping text,
- no placeholder lorem ipsum,
- no dead buttons in P0 flow,
- no unhandled loading states,
- no confusing auth boundary,
- no hidden mock-mode behavior,
- no invented claims presented as evidence.

Build the actual working product experience first. Do not build a marketing homepage before the app is functional.
