"use client";

import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ToastNotice, useToast } from "@/components/toast";
import { Badge, Button, Field, Panel, ProgressBar, inputClass } from "@/components/ui";
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
  downloadUrl: string;
};

type BusyAction = "loading" | "saving" | "demo" | "uploading" | "deleting" | null;

function splitLines(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function syncProfileText(next: ParsedProfile) {
  return {
    skillsText: (next.skills || []).join(", "),
    rolesText: (next.preferences?.targetRoles || []).join(", "),
    educationText: (next.education || []).join("\n"),
  };
}

export function ProfileClient() {
  const [profile, setProfile] = useState<ParsedProfile>(blankProfile);
  const [skillsText, setSkillsText] = useState("");
  const [rolesText, setRolesText] = useState("");
  const [educationText, setEducationText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [busy, setBusy] = useState<BusyAction>("loading");
  const { toast, showToast, clearToast } = useToast();
  const readiness = profileReadiness(profile);

  function applyProfile(next: ParsedProfile) {
    const synced = syncProfileText(next);
    setProfile(next);
    setSkillsText(synced.skillsText);
    setRolesText(synced.rolesText);
    setEducationText(synced.educationText);
  }

  async function load(showNotice = false) {
    setBusy("loading");
    if (showNotice) showToast("Fetching private profile...", "loading");

    try {
      const [payload, resumePayload] = await Promise.all([
        fetch("/api/profile").then((response) => response.json()),
        fetch("/api/profile/resumes")
          .then((response) => response.json())
          .catch(() => ({ resumes: [] })),
      ]);
      applyProfile(payload.profile || blankProfile);
      setResumes(resumePayload.resumes || []);
      if (showNotice) showToast("Profile refreshed.", "success");
    } catch {
      showToast("Could not load your profile. Try refreshing.", "error");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setBusy("saving");
    showToast("Saving private profile...", "loading");
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

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.profile) {
      showToast(payload?.error || "Profile could not be saved.", "error");
      setBusy(null);
      return;
    }

    applyProfile(payload.profile);
    showToast("Profile saved.", "success");
    setBusy(null);
  }

  async function loadDemo() {
    setBusy("demo");
    showToast("Loading demo profile...", "loading");
    const response = await fetch("/api/profile/demo", { method: "POST" });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.profile) {
      showToast(payload?.error || "Demo profile could not be loaded.", "error");
      setBusy(null);
      return;
    }

    applyProfile(payload.profile);
    showToast("Demo profile loaded.", "success");
    setBusy(null);
  }

  async function uploadResume() {
    if (!resumeFile) {
      showToast("Choose a PDF, DOCX, DOC, or TXT resume first.", "error");
      return;
    }

    setBusy("uploading");
    showToast("Uploading private resume...", "loading");
    const formData = new FormData();
    formData.set("file", resumeFile);
    const response = await fetch("/api/profile/resume-upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.profile) {
      showToast(payload?.error || "Resume upload failed.", "error");
      setBusy(null);
      return;
    }

    applyProfile(payload.profile);
    setResumes(payload.resumes || resumes);
    setResumeFile(null);
    showToast(
      payload.file?.extractedTextAvailable
        ? "Resume uploaded and text is ready for tailoring."
        : "Resume uploaded. Paste key text below for stronger tailoring.",
      "success",
    );
    setBusy(null);
  }

  async function deleteResume(id: string) {
    setBusy("deleting");
    showToast("Deleting resume...", "loading");
    const response = await fetch(`/api/profile/resumes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      showToast(payload?.error || "Could not delete resume.", "error");
      setBusy(null);
      return;
    }

    setResumes((current) => current.filter((resume) => resume.id !== id));
    showToast("Resume deleted.", "success");
    setBusy(null);
  }

  if (busy === "loading") {
    return (
      <div className="grid gap-5">
        <ToastNotice toast={toast} onDismiss={clearToast} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Private Profile</h1>
          <p className="mt-1 text-sm text-stone-600">Fetching your profile and resume files.</p>
        </div>
        <Panel className="grid gap-4">
          <div className="h-4 w-36 animate-pulse rounded bg-stone-200" />
          <div className="h-2 w-full animate-pulse rounded-full bg-stone-100" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-md bg-stone-100" />
            <div className="h-40 animate-pulse rounded-md bg-stone-100" />
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <ToastNotice toast={toast} onDismiss={clearToast} />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="green">Private</Badge>
            <span className="text-xs text-stone-500">Only your signed-in account can list, view, or delete uploaded resumes.</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Private Profile</h1>
          <p className="mt-1 text-sm text-stone-600">Your resume, skills, and preferences drive matching and tailoring.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadDemo} disabled={Boolean(busy)}>
            {busy === "demo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Load demo profile
          </Button>
          <Button onClick={save} disabled={Boolean(busy)}>
            {busy === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Confirm and save
          </Button>
        </div>
      </div>

      <Panel className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Profile readiness</div>
            <div className="mt-1 text-xs text-stone-500">More complete data improves matching and tailoring.</div>
          </div>
          <span className="text-sm font-semibold text-stone-900">{readiness}%</span>
        </div>
        <ProgressBar value={readiness} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="grid gap-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <ShieldCheck className="h-4 w-4 text-stone-500" />
            <h2 className="font-semibold">Profile basics</h2>
          </div>
          <Field label="Headline" hint="Example: Full-stack student developer targeting software internships.">
            <input
              className={inputClass}
              value={profile.headline}
              onChange={(event) => setProfile({ ...profile, headline: event.target.value })}
              placeholder="Your current role and target direction"
            />
          </Field>
          <Field label="Summary" hint="Use 2-4 lines that describe your strongest current value.">
            <textarea
              className={`${inputClass} min-h-28`}
              value={profile.summary}
              onChange={(event) => setProfile({ ...profile, summary: event.target.value })}
              placeholder="Short profile summary"
            />
          </Field>
          <Field label="Resume / CV text" hint="Paste the strongest resume text here. Uploaded TXT/PDF/DOCX text fills this automatically when extraction works.">
            <textarea
              className={`${inputClass} min-h-56`}
              value={profile.resumeText}
              onChange={(event) => setProfile({ ...profile, resumeText: event.target.value })}
              placeholder="Paste resume text for better AI tailoring"
            />
          </Field>
        </Panel>

        <Panel className="grid content-start gap-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Upload className="h-4 w-4 text-stone-500" />
            <h2 className="font-semibold">Upload resume</h2>
          </div>
          <Field label="Resume file" hint="PDF, DOC, DOCX, or TXT. Files are opened through an authenticated app route.">
            <input
              className={inputClass}
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            />
          </Field>
          {resumeFile ? (
            <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
              Selected: <span className="font-medium">{resumeFile.name}</span>
            </div>
          ) : null}
          <Button variant="secondary" onClick={uploadResume} disabled={!resumeFile || Boolean(busy)}>
            {busy === "uploading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload selected resume
          </Button>
          <div className="grid gap-3 border-t border-stone-100 pt-4">
            <Field label="Target roles">
              <textarea
                className={`${inputClass} min-h-20`}
                value={rolesText}
                onChange={(event) => setRolesText(event.target.value)}
                placeholder="Software engineer intern, data analyst intern"
              />
            </Field>
            <Field label="Skills">
              <textarea
                className={`${inputClass} min-h-32`}
                value={skillsText}
                onChange={(event) => setSkillsText(event.target.value)}
                placeholder="TypeScript, React, SQL, Python"
              />
            </Field>
            <Field label="Education">
              <textarea
                className={`${inputClass} min-h-24`}
                value={educationText}
                onChange={(event) => setEducationText(event.target.value)}
                placeholder="School, diploma/degree, relevant modules"
              />
            </Field>
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">Uploaded resumes</h2>
            <p className="mt-1 text-xs text-stone-500">View and delete are checked against your signed-in user before touching storage.</p>
          </div>
          <Button variant="secondary" onClick={() => void load(true)} disabled={Boolean(busy)}>
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
                    {resume.extractedTextAvailable ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Text extracted" />
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-stone-500">
                    {formatBytes(resume.sizeBytes)} | {resume.contentType || "application/octet-stream"} |{" "}
                    {resume.extractedTextAvailable ? "Text ready for tailoring" : "File stored privately"}
                  </div>
                  {resume.extractedTextPreview ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-600">{resume.extractedTextPreview}</p>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-stone-500">
                      Text was not extracted from this file. Paste the important resume text above for stronger tailoring.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-medium transition hover:bg-stone-50"
                    href={resume.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View resume <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button variant="danger" onClick={() => deleteResume(resume.id)} disabled={Boolean(busy)}>
                    {busy === "deleting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-stone-200 p-4 text-sm text-stone-600">
            No resume files uploaded yet. Upload a resume or paste text above before generating tailored materials.
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-3 font-semibold">Evidence library</h2>
        {[...profile.projects, ...profile.experience, ...profile.evidence].length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[...profile.projects, ...profile.experience, ...profile.evidence].map((item) => (
              <div key={item.id} className="rounded-md border border-stone-200 p-3">
                <div className="font-medium">{item.label}</div>
                <p className="mt-1 text-sm leading-6 text-stone-600">{item.detail}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-stone-200 p-4 text-sm text-stone-600">
            Add resume text, projects, or use the demo profile to populate evidence for matching.
          </div>
        )}
      </Panel>
    </div>
  );
}
