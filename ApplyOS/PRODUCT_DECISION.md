---
title: ApplyOS Product Decision
status: chosen
date: 2026-07-03
challenge: The LaunchPad Challenge 2026
---

# ApplyOS Product Decision

## Chosen Product

Build **ApplyOS**: an AI internship and entry-level job application operating system for students, fresh graduates, and early-career applicants in Singapore.

ApplyOS helps users discover relevant roles, understand fit, tailor application materials with real evidence, track every application, prepare for interviews, and follow up.

## One-Liner

ApplyOS helps students find suitable internships, tailor applications with proof, track progress, and prepare for interviews.

## Core Problem

Students and fresh graduates do not just need more job listings. They struggle to:

- know which jobs are worth applying to,
- understand which requirements they match,
- tailor resumes and CVs honestly,
- avoid unsupported skill claims,
- track many applications,
- prepare for interviews based on each role,
- follow up at the right time.

## Core Solution

ApplyOS combines job discovery, evidence-based fit analysis, tailored application packs, an application tracker, and role-specific interview preparation.

The product does not replace job portals. It sits above them as an application strategy layer.

## Target Users

- Polytechnic, university, and bootcamp students in Singapore.
- Fresh graduates looking for internships, traineeships, and entry-level roles.
- International students or early-career applicants who need clearer positioning.
- Career coaches or mentors helping students apply better.

## Product Flow

1. User signs up and creates a private profile.
2. User uploads or pastes resume/CV, skills, projects, education, coursework, experience, and preferences.
3. ApplyOS fetches Singapore-relevant jobs from supported sources.
4. User reviews ranked jobs.
5. User opens a job and sees fit score, matched evidence, gaps, and risks.
6. User clicks **Prepare Application**.
7. ApplyOS generates a tailored application pack.
8. User reviews and edits the materials.
9. User clicks **Apply on Source Site** and submits manually.
10. ApplyOS tracks the application and prepares follow-up/interview steps.

## Core Features

### Student Profile

- Resume/CV text or file.
- Education.
- Coursework.
- Projects.
- Work experience.
- Skills.
- Certifications.
- Preferences: role types, location, remote/onsite, salary, seniority, industries.

### Job Discovery

- MyCareersFuture connector for Singapore jobs.
- Adzuna SG connector.
- Greenhouse and Lever company-board connectors.
- Manual link or paste fallback for LinkedIn, JobStreet, Indeed, and company pages.

### Fit Ranking

- Overall fit score.
- Matched skills and requirements.
- Missing or weak evidence.
- Experience mismatch warnings.
- Salary/location/employment-type filters.

### Evidence Matching

For each job requirement, show:

- requirement,
- user evidence,
- evidence source,
- confidence,
- gap or warning,
- recommended action.

### Tailored Application Pack

- Resume bullet suggestions.
- CV/resume version draft.
- Cover letter draft.
- Recruiter message.
- Keywords to include.
- Claims to avoid.

### Application Tracker

Statuses:

- Saved
- Preparing
- Applied
- Follow-up Due
- Interview Scheduled
- Interview Done
- Offer
- Rejected
- Archived

Track:

- source job URL,
- application date,
- submitted resume version,
- cover letter/message used,
- evidence match,
- interview prep,
- notes,
- outcome.

### Mock Interview Prep

- Role-specific questions.
- Suggested answer points from real user evidence.
- Gap questions.
- Behavioral questions.
- Feedback after practice.

## Challenge Track

Primary track: **Applications**.

Secondary angle: **Agentic Systems**, because the system can use a multi-step workflow for job discovery, requirement extraction, evidence matching, tailoring, tracking, and interview coaching.

## Product Guardrails

- Do not auto-submit applications in the MVP.
- Do not scrape LinkedIn, JobStreet, or Indeed at scale.
- Do not store third-party job-board login credentials.
- Do not invent experience, skills, certifications, metrics, or employment history.
- Tailored outputs must distinguish real evidence from suggested learning/gap actions.

## Winning Thesis

ApplyOS is useful because it does not simply generate generic resumes. It helps students apply with evidence: what they match, what they lack, what to say, what not to claim, and how to prepare for the next step.
