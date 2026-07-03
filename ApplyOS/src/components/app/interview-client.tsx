"use client";

import { Bot, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, Button, Panel, inputClass } from "@/components/ui";
import type { InterviewPrepResult, NormalizedJob } from "@/lib/types";

type InterviewApplication = {
  id: string;
  status: string;
  job: NormalizedJob & { id: string };
  interview: (InterviewPrepResult & { id: string }) | null;
};

export function InterviewClient() {
  const [applications, setApplications] = useState<InterviewApplication[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const selected = applications.find((application) => application.id === selectedId) || applications[0];

  async function load() {
    const payload = await fetch("/api/interview-prep").then((response) => response.json());
    setApplications(payload.applications || []);
    setSelectedId((current) => current || payload.applications?.[0]?.id || "");
  }

  async function generate() {
    if (!selected) return;
    setPending(true);
    await fetch("/api/interview-prep", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId: selected.id }),
    });
    await load();
    setPending(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Interview Prep</h1>
          <p className="mt-1 text-sm text-stone-600">Generate questions and answer guidance from the same job/profile evidence.</p>
        </div>
        <Button variant="secondary" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Panel className="h-fit">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Tracked application</span>
            <select className={inputClass} value={selected?.id || ""} onChange={(event) => setSelectedId(event.target.value)}>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.job.title} - {application.job.company}
                </option>
              ))}
            </select>
          </label>
          <Button className="mt-4 w-full" onClick={generate} disabled={pending || !selected}>
            <Bot className="h-4 w-4" />
            {pending ? "Generating..." : "Generate Prep"}
          </Button>
        </Panel>

        {selected?.interview ? (
          <div className="grid gap-4">
            <Panel>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{selected.job.title}</h2>
                  <div className="mt-1 text-sm text-stone-600">{selected.job.company}</div>
                </div>
                <Badge tone="blue">{selected.interview.provider}</Badge>
              </div>
            </Panel>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel>
                <h3 className="mb-3 font-semibold">Questions</h3>
                <ul className="grid gap-2 text-sm text-stone-700">
                  {selected.interview.questions.map((question) => (
                    <li key={question} className="rounded-md bg-stone-50 p-3">
                      {question}
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel>
                <h3 className="mb-3 font-semibold">Answer Guidance</h3>
                <ul className="grid gap-2 text-sm text-stone-700">
                  {selected.interview.answerGuidance.map((item) => (
                    <li key={item} className="rounded-md bg-stone-50 p-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel>
                <h3 className="mb-3 font-semibold">Gap Questions</h3>
                <ul className="grid gap-2 text-sm text-stone-700">
                  {selected.interview.gapQuestions.map((item) => (
                    <li key={item} className="rounded-md bg-stone-50 p-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel>
                <h3 className="mb-3 font-semibold">Technical Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.interview.technicalTopics.map((topic) => (
                    <Badge key={topic} tone="neutral">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        ) : (
          <Panel>
            <div className="text-sm text-stone-600">
              Save an application first, then generate a role-specific interview set.
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
