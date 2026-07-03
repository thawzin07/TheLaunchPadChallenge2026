"use client";

import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ToastNotice, useToast } from "@/components/toast";
import { Badge, Button, Panel, cn, inputClass, statusTone } from "@/components/ui";
import type { ApplicationPackResult, ConnectorStatus, FitAnalysisResult, ScoredJob } from "@/lib/types";

type JobDetail = {
  job: ScoredJob;
  analysis: (FitAnalysisResult & { id: string }) | null;
  application: { id: string; pack?: ApplicationPackResult | null } | null;
};

type PackTab = "bullets" | "resume" | "cover" | "message" | "keywords" | "avoid";
type BusyAction = "search" | "detail" | "analyze" | "save" | "pack" | null;

const packTabs: Array<{ id: PackTab; label: string }> = [
  { id: "bullets", label: "Bullets" },
  { id: "resume", label: "Resume Draft" },
  { id: "cover", label: "Cover Letter" },
  { id: "message", label: "Recruiter Message" },
  { id: "keywords", label: "Keywords" },
  { id: "avoid", label: "Claims to Avoid" },
];

const textareaClass =
  "w-full rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-100";

function connectorLabel(status: ConnectorStatus) {
  if (status.status === "missing_config") return "Not configured";
  if (status.status === "failed") return "Unavailable";
  if (status.status === "mocked") return "Demo fallback";
  if (status.status === "configured") return "Configured";
  if (status.status === "ready") return "Ready";
  return status.status;
}

export function JobsClient() {
  const [query, setQuery] = useState("software engineer intern");
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [statuses, setStatuses] = useState<ConnectorStatus[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pack, setPack] = useState<ApplicationPackResult | null>(null);
  const [packTab, setPackTab] = useState<PackTab>("bullets");
  const [busy, setBusy] = useState<BusyAction>("search");
  const { toast, showToast, clearToast } = useToast();
  const activeJob = useMemo(() => detail?.job || jobs.find((job) => job.id === selectedId) || null, [detail, jobs, selectedId]);

  async function search(fresh = true) {
    setBusy("search");
    showToast("Fetching matching jobs...", "loading");

    try {
      const response = await fetch(`/api/jobs?query=${encodeURIComponent(query)}&fresh=${fresh}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error || "Could not fetch jobs.", "error");
        return;
      }

      setJobs(payload.jobs || []);
      setStatuses(payload.statuses || []);
      setSelectedId("");
      setDetail(null);
      setPack(null);
      showToast(payload.jobs?.length ? "Jobs loaded." : "No jobs found for that search.", payload.jobs?.length ? "success" : "info");
    } catch {
      showToast("Could not fetch jobs. Try again.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function openJob(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
    setDetail(null);
    setPack(null);
    setBusy("detail");
    showToast("Opening job details...", "loading");

    try {
      const response = await fetch(`/api/jobs/${id}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.job) {
        showToast(payload?.error || "Could not open this job.", "error");
        return;
      }

      setDetail(payload);
      setPack(payload.application?.pack || null);
      showToast("Job details ready.", "success");
    } catch {
      showToast("Could not open this job.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function analyze() {
    if (!activeJob) return;
    setBusy("analyze");
    showToast("Running fit analysis...", "loading");

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: activeJob.id }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.analysis) {
      showToast(payload?.error || "Fit analysis failed.", "error");
      setBusy(null);
      return;
    }

    setDetail((current) => ({
      job: activeJob,
      application: current?.application || null,
      analysis: payload.analysis,
    }));
    showToast("Fit analysis ready.", "success");
    setBusy(null);
  }

  async function saveApplication(silent = false) {
    if (!activeJob) return null;
    if (!silent) {
      setBusy("save");
      showToast("Saving job to tracker...", "loading");
    }

    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: activeJob.id, fitAnalysisId: detail?.analysis?.id }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.application) {
      showToast(payload?.error || "Could not save this job.", "error");
      if (!silent) setBusy(null);
      return null;
    }

    setDetail((current) => ({
      job: activeJob,
      analysis: current?.analysis || null,
      application: payload.application,
    }));
    setJobs((current) => current.map((job) => (job.id === activeJob.id ? { ...job, saved: true } : job)));
    if (!silent) {
      showToast("Saved to tracker.", "success");
      setBusy(null);
    }
    return payload.application as { id: string };
  }

  async function generatePack() {
    if (!activeJob) return;
    setBusy("pack");
    showToast("Tailoring resume and application pack...", "loading");

    const application = detail?.application || (await saveApplication(true));
    if (!application) {
      setBusy(null);
      return;
    }

    const response = await fetch("/api/application-pack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId: application.id }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.pack) {
      showToast(payload?.error || "Could not generate tailored materials.", "error");
      setBusy(null);
      return;
    }

    setPack(payload.pack);
    setDetail((current) =>
      current
        ? {
            ...current,
            analysis: payload.analysis || current.analysis,
            application: { ...(current.application || application), pack: payload.pack },
          }
        : current,
    );
    showToast("Tailored resume draft ready.", "success");
    setBusy(null);
  }

  function copyPack() {
    if (!pack) return;
    void navigator.clipboard.writeText(
      [
        pack.resumeBullets.map((bullet) => `- ${bullet}`).join("\n"),
        pack.resumeDraft,
        pack.coverLetter,
        pack.recruiterMessage,
      ].join("\n\n"),
    );
    showToast("Application pack copied.", "success");
  }

  useEffect(() => {
    void search(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-5">
      <ToastNotice toast={toast} onDismiss={clearToast} />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Discovery</h1>
          <p className="mt-1 text-sm text-stone-600">Search Singapore roles, compare fit, and generate tailored materials.</p>
        </div>
        <form
          className="flex w-full gap-2 sm:max-w-xl"
          onSubmit={(event) => {
            event.preventDefault();
            void search(true);
          }}
        >
          <input
            className={inputClass}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search jobs"
          />
          <Button type="submit" disabled={busy === "search"}>
            {busy === "search" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </form>
      </div>

      {statuses.length ? (
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <Badge key={status.source} tone={statusTone(status.status)}>
              {status.label}: {connectorLabel(status)}
            </Badge>
          ))}
        </div>
      ) : null}

      <Panel className="p-2">
        {busy === "search" && !jobs.length ? (
          <div className="grid gap-2 p-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-md bg-stone-100" />
            ))}
          </div>
        ) : jobs.length ? (
          <div className="grid gap-2">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => void openJob(job.id)}
                className={cn(
                  "grid gap-3 rounded-md border p-3 text-left transition hover:border-stone-300 hover:bg-stone-50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
                  selectedId === job.id ? "border-stone-900 bg-stone-50" : "border-stone-200 bg-white",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate font-medium">{job.title}</div>
                    {job.saved ? <Badge tone="green">Saved</Badge> : null}
                  </div>
                  <div className="mt-1 text-sm text-stone-600">{job.company}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                    <span>{job.source}</span>
                    <span>{job.location}</span>
                    <span>{job.workMode}</span>
                  </div>
                  <div className="mt-2 line-clamp-1 text-xs text-stone-600">
                    Match: {job.topMatches.slice(0, 3).join(", ") || "review required"}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <Badge tone={job.roughFitScore >= 70 ? "green" : job.roughFitScore >= 55 ? "amber" : "red"}>
                    {job.roughFitScore}
                  </Badge>
                  <span className="inline-flex min-h-10 items-center rounded-md border border-stone-200 px-3 text-sm font-medium">
                    View
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-stone-200 p-4 text-sm text-stone-600">
            No jobs loaded yet. Try a different role or refresh the search.
          </div>
        )}
      </Panel>

      {detailOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-stone-950/45 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg border border-stone-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {activeJob?.source || "Job"}
                </div>
                <h2 className="mt-1 truncate text-xl font-semibold">{activeJob?.title || "Loading job"}</h2>
                <div className="mt-1 text-sm text-stone-600">
                  {activeJob ? `${activeJob.company} | ${activeJob.location}` : "Fetching details"}
                </div>
              </div>
              <button
                type="button"
                className="rounded-md p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                onClick={() => setDetailOpen(false)}
                aria-label="Close job details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-88px)] overflow-auto p-4">
              {busy === "detail" && !detail ? (
                <div className="grid gap-3">
                  <div className="h-32 animate-pulse rounded-md bg-stone-100" />
                  <div className="h-56 animate-pulse rounded-md bg-stone-100" />
                </div>
              ) : activeJob ? (
                <div className="grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={analyze} disabled={Boolean(busy)}>
                      {busy === "analyze" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                      Analyze fit
                    </Button>
                    <Button variant="secondary" onClick={() => void saveApplication()} disabled={Boolean(busy)}>
                      {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BriefcaseBusiness className="h-4 w-4" />}
                      Save to tracker
                    </Button>
                    <Button onClick={generatePack} disabled={Boolean(busy)}>
                      {busy === "pack" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      Tailor resume
                    </Button>
                    <a
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-medium transition hover:bg-stone-50"
                      href={activeJob.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Apply on source <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>

                  <Panel className="shadow-none">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge tone={activeJob.roughFitScore >= 70 ? "green" : activeJob.roughFitScore >= 55 ? "amber" : "red"}>
                        Fit {activeJob.roughFitScore}/100
                      </Badge>
                      {activeJob.employmentTypes.slice(0, 3).map((type) => (
                        <Badge key={type} tone="neutral">
                          {type}
                        </Badge>
                      ))}
                      {activeJob.skills.slice(0, 8).map((skill) => (
                        <Badge key={skill} tone="blue">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="max-h-56 overflow-auto text-sm leading-6 text-stone-700">{activeJob.descriptionText}</p>
                  </Panel>

                  {detail?.analysis ? (
                    <Panel className="shadow-none">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="font-semibold">Fit analysis</h3>
                        <Badge tone={detail.analysis.overallScore >= 70 ? "green" : detail.analysis.overallScore >= 55 ? "amber" : "red"}>
                          {detail.analysis.overallScore}/100
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-stone-700">{detail.analysis.summary}</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="mb-2 text-sm font-medium">Claims and evidence</div>
                          <div className="grid gap-2">
                            {detail.analysis.evidenceMatches.slice(0, 6).map((match) => (
                              <div key={match.claim} className="rounded-md border border-stone-200 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium">{match.claim}</span>
                                  <Badge tone={statusTone(match.status)}>{match.status}</Badge>
                                </div>
                                <div className="mt-1 text-xs leading-5 text-stone-600">{match.evidence}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 text-sm font-medium">Before applying</div>
                          <ul className="grid gap-2 text-sm text-stone-700">
                            {detail.analysis.risks.map((risk) => (
                              <li key={risk} className="rounded-md bg-stone-50 p-3">
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Panel>
                  ) : null}

                  {pack ? (
                    <Panel className="shadow-none">
                      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="font-semibold">Tailored application pack</h3>
                          <p className="mt-1 text-xs text-stone-500">Edit before sending. The app does not submit applications for you.</p>
                        </div>
                        <Button variant="secondary" onClick={copyPack}>
                          <Copy className="h-4 w-4" />
                          Copy all
                        </Button>
                      </div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {packTabs.map((tab) => (
                          <button
                            key={tab.id}
                            className={cn(
                              "rounded-md border px-3 py-2 text-sm font-medium transition",
                              packTab === tab.id
                                ? "border-stone-950 bg-stone-950 text-white"
                                : "border-stone-200 hover:bg-stone-50",
                            )}
                            onClick={() => setPackTab(tab.id)}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      {packTab === "bullets" ? (
                        <textarea
                          className={`${textareaClass} min-h-56`}
                          value={pack.resumeBullets.map((bullet) => `- ${bullet}`).join("\n")}
                          onChange={(event) =>
                            setPack({
                              ...pack,
                              resumeBullets: event.target.value
                                .split("\n")
                                .map((line) => line.replace(/^-\s*/, ""))
                                .filter(Boolean),
                            })
                          }
                        />
                      ) : null}
                      {packTab === "resume" ? (
                        <textarea
                          className={`${textareaClass} min-h-72`}
                          value={pack.resumeDraft}
                          onChange={(event) => setPack({ ...pack, resumeDraft: event.target.value })}
                        />
                      ) : null}
                      {packTab === "cover" ? (
                        <textarea
                          className={`${textareaClass} min-h-72`}
                          value={pack.coverLetter}
                          onChange={(event) => setPack({ ...pack, coverLetter: event.target.value })}
                        />
                      ) : null}
                      {packTab === "message" ? (
                        <textarea
                          className={`${textareaClass} min-h-40`}
                          value={pack.recruiterMessage}
                          onChange={(event) => setPack({ ...pack, recruiterMessage: event.target.value })}
                        />
                      ) : null}
                      {packTab === "keywords" ? (
                        <textarea
                          className={`${textareaClass} min-h-40`}
                          value={pack.keywords.join(", ")}
                          onChange={(event) =>
                            setPack({
                              ...pack,
                              keywords: event.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      ) : null}
                      {packTab === "avoid" ? (
                        <textarea
                          className={`${textareaClass} min-h-40`}
                          value={pack.claimsToAvoid.map((claim) => `- ${claim}`).join("\n")}
                          onChange={(event) =>
                            setPack({
                              ...pack,
                              claimsToAvoid: event.target.value
                                .split("\n")
                                .map((line) => line.replace(/^-\s*/, ""))
                                .filter(Boolean),
                            })
                          }
                        />
                      ) : null}
                    </Panel>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-stone-200 p-4 text-sm text-stone-600">
                  Job details are unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
