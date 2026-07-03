"use client";

import { ExternalLink, FileText, Save, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Field, Panel, ProgressBar, inputClass } from "@/components/ui";
import { profileReadiness } from "@/lib/profile";
import type { ParsedProfile } from "@/lib/types";

const blankProfile: ParsedProfile = {
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

type ResumeSummary = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  extractedTextAvailable: boolean;
  extractedTextPreview?: string;
  createdAt: string;
  signedUrl?: string | null;
};

function splitLines(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProfileClient() {
  const [profile, setProfile] = useState<ParsedProfile>(blankProfile);
  const [skillsText, setSkillsText] = useState("");
  const [rolesText, setRolesText] = useState("");
  const [educationText, setEducationText] = useState("");
  const [status, setStatus] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const readiness = profileReadiness(profile);

  async function load() {
    const [payload, resumePayload] = await Promise.all([
      fetch("/api/profile").then((response) => response.json()),
      fetch("/api/profile/resumes").then((response) => response.json()).catch(() => ({ resumes: [] })),
    ]);
    const next = payload.profile || blankProfile;
    setProfile(next);
    setSkillsText((next.skills || []).join(", "));
    setRolesText((next.preferences?.targetRoles || []).join(", "));
    setEducationText((next.education || []).join("\n"));
    setResumes(resumePayload.resumes || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setStatus("Saving...");
    const next: ParsedProfile = {
      ...profile,
      education: splitLines(educationText),
      skills: splitLines(skillsText),
      preferences: {
        ...profile.preferences,
        targetRoles: splitLines(rolesText),
        locations: profile.preferences.locations?.length ? profile.preferences.locations : ["Singapore"],
      },
    };

    const payload = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    }).then((response) => response.json());
    setProfile(payload.profile);
    setStatus("Saved");
  }

  async function loadDemo() {
    setStatus("Loading demo profile...");
    const payload = await fetch("/api/profile/demo", { method: "POST" }).then((response) => response.json());
    const next = payload.profile;
    setProfile(next);
    setSkillsText(next.skills.join(", "));
    setRolesText((next.preferences?.targetRoles || []).join(", "));
    setEducationText((next.education || []).join("\n"));
    setStatus("Demo profile loaded");
  }

  async function uploadResume() {
    if (!resumeFile) {
      setStatus("Choose a resume file first.");
      return;
    }

    setStatus("Uploading resume...");
    const formData = new FormData();
    formData.set("file", resumeFile);
    const response = await fetch("/api/profile/resume-upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || "Resume upload failed.");
      return;
    }

    const next = payload.profile;
    setProfile(next);
    setResumes(payload.resumes || resumes);
    setSkillsText((next.skills || []).join(", "));
    setRolesText((next.preferences?.targetRoles || []).join(", "));
    setEducationText((next.education || []).join("\n"));
    setStatus(`Uploaded ${payload.file.name}`);
  }

  async function deleteResume(id: string) {
    setStatus("Deleting resume...");
    const response = await fetch(`/api/profile/resumes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(payload?.error || "Could not delete resume.");
      return;
    }

    setResumes((current) => current.filter((resume) => resume.id !== id));
    setStatus("Resume deleted");
  }

  function formatBytes(value: number) {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Private Profile</h1>
          <p className="mt-1 text-sm text-stone-600">This is the source of truth for matching, drafts, and interviews.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadDemo}>
            <Sparkles className="h-4 w-4" />
            Load Demo
          </Button>
          <Button onClick={save}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <Panel>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Profile readiness</span>
          <span className="text-sm text-stone-500">{readiness}%</span>
        </div>
        <ProgressBar value={readiness} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Panel className="grid gap-4">
          <Field label="Headline">
            <input
              className={inputClass}
              value={profile.headline}
              onChange={(event) => setProfile({ ...profile, headline: event.target.value })}
            />
          </Field>
          <Field label="Summary">
            <textarea
              className={`${inputClass} min-h-28`}
              value={profile.summary}
              onChange={(event) => setProfile({ ...profile, summary: event.target.value })}
            />
          </Field>
          <Field label="Resume / CV text" hint="Paste plain text first. File upload can be added after the vertical slice is stable.">
            <textarea
              className={`${inputClass} min-h-52`}
              value={profile.resumeText}
              onChange={(event) => setProfile({ ...profile, resumeText: event.target.value })}
            />
          </Field>
        </Panel>

        <Panel className="grid content-start gap-4">
          <Field label="Resume file" hint="Uploads PDF, DOC, DOCX, or TXT to the private Supabase Storage bucket. TXT files also fill resume text.">
            <input
              className={inputClass}
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            />
          </Field>
          <Button variant="secondary" onClick={uploadResume} disabled={!resumeFile}>
            <Upload className="h-4 w-4" />
            Upload Resume
          </Button>
          <Field label="Target roles">
            <textarea className={`${inputClass} min-h-20`} value={rolesText} onChange={(event) => setRolesText(event.target.value)} />
          </Field>
          <Field label="Skills">
            <textarea className={`${inputClass} min-h-32`} value={skillsText} onChange={(event) => setSkillsText(event.target.value)} />
          </Field>
          <Field label="Education">
            <textarea
              className={`${inputClass} min-h-24`}
              value={educationText}
              onChange={(event) => setEducationText(event.target.value)}
            />
          </Field>
          {status ? <div className="rounded-md bg-stone-100 p-3 text-sm text-stone-700">{status}</div> : null}
        </Panel>
      </div>

      <Panel>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Uploaded Resumes</h2>
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>
        {resumes.length ? (
          <div className="grid gap-3">
            {resumes.map((resume) => (
              <div key={resume.id} className="grid gap-3 rounded-md border border-stone-200 p-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-stone-500" />
                    <div className="truncate text-sm font-medium">{resume.fileName}</div>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">
                    {formatBytes(resume.sizeBytes)} - {resume.contentType || "application/octet-stream"} -{" "}
                    {resume.extractedTextAvailable ? "text extracted" : "stored only"}
                  </div>
                  {resume.extractedTextPreview ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-600">{resume.extractedTextPreview}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {resume.signedUrl ? (
                    <a
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-medium hover:bg-stone-50"
                      href={resume.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  <Button variant="danger" onClick={() => deleteResume(resume.id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-stone-200 p-4 text-sm text-stone-600">
            No resume files uploaded yet. Uploading a TXT, PDF, or DOCX resume stores the file privately and uses extracted
            text for tailoring.
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-3 font-semibold">Evidence Library</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[...profile.projects, ...profile.experience, ...profile.evidence].map((item) => (
            <div key={item.id} className="rounded-md border border-stone-200 p-3">
              <div className="font-medium">{item.label}</div>
              <p className="mt-1 text-sm leading-6 text-stone-600">{item.detail}</p>
              <div className="mt-2 text-xs text-stone-500">{item.tags.join(", ")}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
