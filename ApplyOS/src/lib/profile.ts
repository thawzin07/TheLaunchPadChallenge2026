import type { UserProfile } from "@prisma/client";

import { parseJson, stringifyJson } from "@/lib/json";
import type { EvidenceItem, ParsedProfile } from "@/lib/types";

export const emptyProfile: ParsedProfile = {
  headline: "",
  summary: "",
  resumeText: "",
  education: [],
  skills: [],
  projects: [],
  experience: [],
  certifications: [],
  coursework: [],
  preferences: {},
  evidence: [],
};

export const demoProfile: ParsedProfile = {
  headline: "Computer science student targeting software engineering internships",
  summary:
    "I build full-stack products, data pipelines, and AI-assisted tools. I am looking for Singapore internships where I can ship reliable software and learn from strong engineering teams.",
  resumeText:
    "Computer science student with projects in Next.js, Python, SQL, data visualization, API integration, and AI-assisted automation. Built dashboards, workflow tools, and prototype agents for hackathon and coursework settings.",
  education: ["BSc Computer Science, Singapore"],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Python",
    "SQL",
    "PostgreSQL",
    "REST APIs",
    "Data visualization",
    "OpenAI API",
    "Prisma",
  ],
  projects: [
    {
      id: "applyos",
      label: "ApplyOS",
      detail:
        "Built an evidence-backed job application workspace with job discovery, fit analysis, tailored materials, tracking, and interview prep.",
      tags: ["Next.js", "TypeScript", "AI", "Prisma"],
    },
    {
      id: "data-viz",
      label: "Data engineering dashboard",
      detail:
        "Created a dashboard workflow that cleaned source data, visualized trends, and explained trade-offs for non-technical reviewers.",
      tags: ["Python", "SQL", "Data visualization"],
    },
  ],
  experience: [
    {
      id: "coursework",
      label: "Course and project work",
      detail:
        "Worked in small teams to scope requirements, write production-shaped code, review outputs, and present technical decisions.",
      tags: ["Teamwork", "Documentation", "Testing"],
    },
  ],
  certifications: ["AI application prototyping", "Data analytics fundamentals"],
  coursework: ["Algorithms", "Database systems", "Web application development", "Data engineering"],
  preferences: {
    targetRoles: ["Software Engineer Intern", "AI Engineer Intern", "Data Engineer Intern"],
    locations: ["Singapore", "Remote"],
    workModes: ["hybrid", "onsite", "remote"],
  },
  evidence: [
    {
      id: "shipping",
      label: "Shipping habit",
      detail:
        "Can move from requirements to a working demo with auth, data models, integrations, and verification.",
      tags: ["Execution", "Full-stack"],
    },
    {
      id: "api",
      label: "API integration",
      detail:
        "Has implemented API adapters, graceful fallbacks, environment configuration, and health states.",
      tags: ["APIs", "Reliability"],
    },
  ],
};

export function parseProfile(profile?: UserProfile | null): ParsedProfile {
  if (!profile) return emptyProfile;

  return {
    headline: profile.headline,
    summary: profile.summary,
    resumeText: profile.resumeText,
    education: parseJson<string[]>(profile.educationJson, []),
    skills: parseJson<string[]>(profile.skillsJson, []),
    projects: parseJson<EvidenceItem[]>(profile.projectsJson, []),
    experience: parseJson<EvidenceItem[]>(profile.experienceJson, []),
    certifications: parseJson<string[]>(profile.certificationsJson, []),
    coursework: parseJson<string[]>(profile.courseworkJson, []),
    preferences: parseJson<ParsedProfile["preferences"]>(profile.preferencesJson, {}),
    evidence: parseJson<EvidenceItem[]>(profile.evidenceJson, []),
  };
}

export function serializeProfile(profile: ParsedProfile) {
  return {
    headline: profile.headline,
    summary: profile.summary,
    resumeText: profile.resumeText,
    educationJson: stringifyJson(profile.education),
    skillsJson: stringifyJson(profile.skills),
    projectsJson: stringifyJson(profile.projects),
    experienceJson: stringifyJson(profile.experience),
    certificationsJson: stringifyJson(profile.certifications),
    courseworkJson: stringifyJson(profile.coursework),
    preferencesJson: stringifyJson(profile.preferences),
    evidenceJson: stringifyJson(profile.evidence),
  };
}

export function profileReadiness(profile: ParsedProfile) {
  const checks = [
    profile.headline,
    profile.summary,
    profile.resumeText,
    profile.skills.length >= 5 ? "skills" : "",
    profile.projects.length > 0 ? "projects" : "",
    profile.evidence.length > 0 ? "evidence" : "",
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
