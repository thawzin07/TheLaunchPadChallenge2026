---
title: ApplyOS Data Model
status: draft
date: 2026-07-03
---

# ApplyOS Data Model

## Core Entities

### User

Auth-owned account identity.

Fields:

- `id`
- `email`
- `name`
- `createdAt`
- `updatedAt`

### UserProfile

Private applicant profile.

Fields:

- `id`
- `userId`
- `headline`
- `summary`
- `resumeText`
- `education`
- `skills`
- `projects`
- `experience`
- `certifications`
- `coursework`
- `preferences`
- `createdAt`
- `updatedAt`

### EvidenceItem

Structured proof extracted from profile/resume/projects.

Fields:

- `id`
- `userId`
- `type`: skill, project, coursework, experience, certification, achievement
- `title`
- `description`
- `skills`
- `source`
- `confidence`
- `createdAt`
- `updatedAt`

### JobListing

Normalized job from external source or manual import.

Fields:

- `id`
- `source`
- `sourceJobId`
- `sourceUrl`
- `title`
- `company`
- `location`
- `workMode`
- `employmentType`
- `seniority`
- `salaryMin`
- `salaryMax`
- `salaryCurrency`
- `postedAt`
- `expiresAt`
- `descriptionText`
- `skills`
- `rawSourceHash`
- `fetchedAt`
- `createdAt`
- `updatedAt`

### FitAnalysis

User-specific job match.

Fields:

- `id`
- `userId`
- `jobListingId`
- `overallScore`
- `summary`
- `matchedRequirements`
- `missingRequirements`
- `evidenceMatches`
- `risks`
- `provider`
- `model`
- `latencyMs`
- `createdAt`
- `updatedAt`

### Application

Tracked application.

Fields:

- `id`
- `userId`
- `jobListingId`
- `fitAnalysisId`
- `status`
- `sourceUrl`
- `appliedAt`
- `followUpAt`
- `interviewAt`
- `notes`
- `outcome`
- `createdAt`
- `updatedAt`

Statuses:

- `saved`
- `preparing`
- `applied`
- `follow_up_due`
- `interview_scheduled`
- `interview_done`
- `offer`
- `rejected`
- `archived`

### ApplicationPack

Generated application materials.

Fields:

- `id`
- `userId`
- `applicationId`
- `resumeBullets`
- `coverLetter`
- `recruiterMessage`
- `keywords`
- `claimsToAvoid`
- `provider`
- `model`
- `latencyMs`
- `createdAt`
- `updatedAt`

### InterviewPrep

Role-specific interview practice.

Fields:

- `id`
- `userId`
- `applicationId`
- `questions`
- `answerGuidance`
- `gapQuestions`
- `technicalTopics`
- `behavioralStories`
- `provider`
- `model`
- `latencyMs`
- `createdAt`
- `updatedAt`

### ApiRun

Telemetry for AI and external API calls.

Fields:

- `id`
- `userId`
- `type`: ai, job_source
- `provider`
- `modelOrEndpoint`
- `status`
- `latencyMs`
- `errorMessage`
- `createdAt`

Do not store sensitive prompt contents in `ApiRun` for production.

## Initial Database Choice

Use PostgreSQL with Prisma or Drizzle.

For fastest production-shaped build:

- Supabase Postgres + Supabase Storage if using Supabase Auth/Storage.
- Neon Postgres + Vercel Blob if using Clerk/Auth.js.

Implementation should choose one integrated path and avoid mixing services unnecessarily.

## Seed Data

Create seed/demo data:

- sample student profile,
- sample Singapore jobs,
- sample fit analysis,
- sample application pack,
- sample tracker states.

Seed data must be clearly marked as demo data.
