"use client";

import { ArrowUpRight, Bot, BriefcaseBusiness, Copy, FileText, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge, Button, Panel, inputClass, statusTone } from "@/components/ui";
import type { ApplicationPackResult, ConnectorStatus, FitAnalysisResult, ScoredJob } from "@/lib/types";

type JobDetail = {
  job: ScoredJob;
  analysis: (FitAnalysisResult & { id: string }) | null;
  application: { id: string; pack?: ApplicationPackResult | null } | null;
};

type PackTab = "bullets" | "resume" | "cover" | "message" | "keywords" | "avoid";

const packTabs: Array<{ id: PackTab; label: string }> = [
  { id: "bullets", label: "Bullets" },
  { id: "resume", label: "Resume Draft" },
  { id: "cover", label: "Cover Letter" },
  { id: "message", label: "Recruiter Message" },
  { id: "keywords", label: "Keywords" },
  { id: "avoid", label: "Claims to Avoid" },
];

export function JobsClient() {
  const [query, setQuery] = useState("software engineer intern");
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [statuses, setStatuses] = useState<ConnectorStatus[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [pack, setPack] = useState<ApplicationPackResult | null>(null);
  const [packTab, setPackTab] = useState<PackTab>("bullets");
  const [loading, setLoading] = useState(false);
  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedId) || jobs[0], [jobs, selectedId]);

  async function search(fresh = true) {
    setLoading(true);
    const payload = await fetch(`/api/jobs?query=${encodeURIComponent(query)}&fresh=${fresh}`).then((response) =>
      response.json(),
    );
    setJobs(payload.jobs || []);
    setStatuses(payload.statuses || []);
    setSelectedId(payload.jobs?.[0]?.id || "");
    setDetail(null);
    setPack(null);
    setLoading(false);
  }

  async function loadDetail(id = selectedJob?.id) {
    if (!id) return;
    const payload = await fetch(`/api/jobs/${id}`).then((response) => response.json());
    setDetail(payload);
    setSelectedId(id);
    setPack(payload.application?.pack || null);
  }

  async function analyze() {
    if (!selectedJob) return;
    const payload = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: selectedJob.id }),
    }).then((response) => response.json());
    setDetail((current) => ({
      job: selectedJob,
      application: current?.application || null,
      analysis: payload.analysis,
    }));
  }

  async function saveApplication() {
    if (!selectedJob) return null;
    const payload = await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: selectedJob.id, fitAnalysisId: detail?.analysis?.id }),
    }).then((response) => response.json());
    setDetail((current) => ({
      job: selectedJob,
      analysis: current?.analysis || null,
      application: payload.application,
    }));
    return payload.application as { id: string };
  }

  async function generatePack() {
    const application = detail?.application || (await saveApplication());
    if (!application) return;
    const payload = await fetch("/api/application-pack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId: application.id }),
    }).then((response) => response.json());
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
  }

  useEffect(() => {
    void search(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedJob) void loadDetail(selectedJob.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob?.id]);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Discovery</h1>
          <p className="mt-1 text-sm text-stone-600">Fetch Singapore roles, normalize them, and run evidence-backed fit analysis.</p>
        </div>
        <form
          className="flex w-full gap-2 sm:max-w-xl"
          onSubmit={(event) => {
            event.preventDefault();
            void search(true);
          }}
        >
          <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button type="submit" disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Badge key={status.source} tone={statusTone(status.status)}>
            {status.label}: {status.status}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Panel className="max-h-[calc(100vh-190px)] overflow-auto p-2">
          <div className="grid gap-2">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedId(job.id)}
                className={`rounded-md border p-3 text-left transition hover:bg-stone-50 ${
                  selectedJob?.id === job.id ? "border-stone-900 bg-stone-50" : "border-stone-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{job.title}</div>
                    <div className="mt-1 text-sm text-stone-600">{job.company}</div>
                  </div>
                  <Badge tone={job.roughFitScore >= 70 ? "green" : job.roughFitScore >= 55 ? "amber" : "red"}>
                    {job.roughFitScore}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-xs text-stone-500">
                  <span>{job.source}</span>
                  <span>{job.location}</span>
                  <span>{job.workMode}</span>
                </div>
                <div className="mt-2 text-xs text-stone-600">Match: {job.topMatches.slice(0, 3).join(", ") || "review required"}</div>
              </button>
            ))}
          </div>
        </Panel>

        {selectedJob ? (
          <div className="grid gap-4">
            <Panel>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <BriefcaseBusiness className="h-4 w-4" />
                    {selectedJob.source}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">{selectedJob.title}</h2>
                  <div className="mt-1 text-sm text-stone-600">
                    {selectedJob.company} - {selectedJob.location}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={analyze}>
                    <Bot className="h-4 w-4" />
                    Analyze
                  </Button>
                  <Button variant="secondary" onClick={saveApplication}>
                    <BriefcaseBusiness className="h-4 w-4" />
                    Save
                  </Button>
                  <Button onClick={generatePack}>
                    <FileText className="h-4 w-4" />
                    Generate Pack
                  </Button>
                  <a
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-medium hover:bg-stone-50"
                    href={selectedJob.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apply Source <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <p className="mt-4 max-h-44 overflow-auto text-sm leading-6 text-stone-700">{selectedJob.descriptionText}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedJob.skills.slice(0, 10).map((skill) => (
                  <Badge key={skill} tone="blue">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Panel>

            {detail?.analysis ? (
              <Panel>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Fit Analysis</h3>
                  <Badge tone={detail.analysis.overallScore >= 70 ? "green" : detail.analysis.overallScore >= 55 ? "amber" : "red"}>
                    {detail.analysis.overallScore}/100
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-stone-700">{detail.analysis.summary}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-sm font-medium">Claim / evidence table</div>
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
                    <div className="mb-2 text-sm font-medium">Red flags before submission</div>
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
              <Panel>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Application Pack</h3>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        [
                          pack.resumeBullets.map((bullet) => `- ${bullet}`).join("\n"),
                          pack.resumeDraft,
                          pack.coverLetter,
                          pack.recruiterMessage,
                        ].join("\n\n"),
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                    Copy All
                  </Button>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {packTabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`rounded-md border px-3 py-2 text-sm font-medium ${
                        packTab === tab.id ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 hover:bg-stone-50"
                      }`}
                      onClick={() => setPackTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {packTab === "bullets" ? (
                  <textarea
                    className="min-h-56 w-full rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                    value={pack.resumeBullets.map((bullet) => `- ${bullet}`).join("\n")}
                    onChange={(event) =>
                      setPack({ ...pack, resumeBullets: event.target.value.split("\n").map((line) => line.replace(/^-\s*/, "")).filter(Boolean) })
                    }
                  />
                ) : null}
                {packTab === "resume" ? (
                  <textarea
                    className="min-h-72 w-full rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                    value={pack.resumeDraft}
                    onChange={(event) => setPack({ ...pack, resumeDraft: event.target.value })}
                  />
                ) : null}
                {packTab === "cover" ? (
                  <textarea
                    className="min-h-72 w-full rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                    value={pack.coverLetter}
                    onChange={(event) => setPack({ ...pack, coverLetter: event.target.value })}
                  />
                ) : null}
                {packTab === "message" ? (
                  <textarea
                    className="min-h-40 w-full rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                    value={pack.recruiterMessage}
                    onChange={(event) => setPack({ ...pack, recruiterMessage: event.target.value })}
                  />
                ) : null}
                {packTab === "keywords" ? (
                  <textarea
                    className="min-h-40 w-full rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                    value={pack.keywords.join(", ")}
                    onChange={(event) => setPack({ ...pack, keywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
                  />
                ) : null}
                {packTab === "avoid" ? (
                  <textarea
                    className="min-h-40 w-full rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700 outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                    value={pack.claimsToAvoid.map((claim) => `- ${claim}`).join("\n")}
                    onChange={(event) =>
                      setPack({ ...pack, claimsToAvoid: event.target.value.split("\n").map((line) => line.replace(/^-\s*/, "")).filter(Boolean) })
                    }
                  />
                ) : null}
                <div className="mt-3 text-xs leading-5 text-stone-500">
                  Review before sending. The saved generated pack remains unchanged until you regenerate it.
                </div>
              </Panel>
            ) : null}
          </div>
        ) : (
          <Panel>No jobs loaded yet.</Panel>
        )}
      </div>
    </div>
  );
}
