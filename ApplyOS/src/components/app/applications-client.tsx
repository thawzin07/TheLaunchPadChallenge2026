"use client";

import { ArrowUpRight, Copy, FileText, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, Button, Panel, inputClass, statusTone } from "@/components/ui";
import type { ApplicationPackResult, FitAnalysisResult, NormalizedJob } from "@/lib/types";

type TrackedApplication = {
  id: string;
  status: string;
  notes: string;
  outcome: string;
  sourceUrl: string;
  job: NormalizedJob & { id: string };
  analysis: (FitAnalysisResult & { id: string }) | null;
  pack: (ApplicationPackResult & { id: string }) | null;
  interview: unknown | null;
};

const statuses = [
  "saved",
  "preparing",
  "applied",
  "follow-up due",
  "interview scheduled",
  "interview done",
  "offer",
  "rejected",
  "archived",
];

export function ApplicationsClient() {
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const selected = applications.find((application) => application.id === selectedId) || applications[0];

  async function load() {
    const payload = await fetch("/api/applications").then((response) => response.json());
    setApplications(payload.applications || []);
    setSelectedId((current) => current || payload.applications?.[0]?.id || "");
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(id: string, patch: Partial<TrackedApplication>) {
    setPending(true);
    const payload = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).then((response) => response.json());

    setApplications((current) =>
      current.map((application) => (application.id === id ? payload.application : application)),
    );
    setPending(false);
  }

  async function generatePack(applicationId: string) {
    setPending(true);
    await fetch("/api/application-pack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });
    await load();
    setPending(false);
  }

  const grouped = statuses.map((status) => ({
    status,
    applications: applications.filter((application) => application.status === status),
  }));

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Application Tracker</h1>
          <p className="mt-1 text-sm text-stone-600">Track what happened after ApplyOS helps you prepare.</p>
        </div>
        <Button variant="secondary" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_460px]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map((group) => (
            <Panel key={group.status} className="min-h-40 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold capitalize">{group.status}</h2>
                <Badge tone={statusTone(group.status)}>{group.applications.length}</Badge>
              </div>
              <div className="grid gap-2">
                {group.applications.map((application) => (
                  <button
                    key={application.id}
                    onClick={() => setSelectedId(application.id)}
                    className={`rounded-md border p-3 text-left text-sm hover:bg-stone-50 ${
                      selected?.id === application.id ? "border-stone-900" : "border-stone-200"
                    }`}
                  >
                    <div className="font-medium">{application.job.title}</div>
                    <div className="mt-1 text-stone-500">{application.job.company}</div>
                    <div className="mt-2 flex gap-2">
                      {application.pack ? <Badge tone="green">pack</Badge> : <Badge tone="amber">no pack</Badge>}
                      {application.analysis ? <Badge tone="blue">{application.analysis.overallScore}</Badge> : null}
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          ))}
        </div>

        <Panel className="h-fit">
          {selected ? (
            <div className="grid gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.job.title}</h2>
                    <div className="mt-1 text-sm text-stone-600">{selected.job.company}</div>
                  </div>
                  <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-medium hover:bg-stone-50"
                    href={selected.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <Button variant="secondary" onClick={() => generatePack(selected.id)} disabled={pending}>
                    <FileText className="h-4 w-4" />
                    Generate Pack
                  </Button>
                </div>
              </div>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Status</span>
                <select
                  className={inputClass}
                  value={selected.status}
                  onChange={(event) => update(selected.id, { status: event.target.value })}
                  disabled={pending}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Notes</span>
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={selected.notes}
                  onChange={(event) =>
                    setApplications((current) =>
                      current.map((application) =>
                        application.id === selected.id ? { ...application, notes: event.target.value } : application,
                      ),
                    )
                  }
                />
              </label>
              <Button variant="secondary" onClick={() => update(selected.id, { notes: selected.notes })} disabled={pending}>
                <Save className="h-4 w-4" />
                Save Notes
              </Button>

              {selected.pack ? (
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Saved Pack</h3>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void navigator.clipboard.writeText(`${selected.pack?.resumeDraft}\n\n${selected.pack?.coverLetter}`)
                      }
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                    {selected.pack.resumeDraft}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-stone-600">Save a job from the Jobs screen to start tracking it.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
