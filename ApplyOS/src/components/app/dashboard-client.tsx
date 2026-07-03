"use client";

import { AlertTriangle, BriefcaseBusiness, CheckCircle2, FileText, ListChecks, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, Button, Panel, ProgressBar, statusTone } from "@/components/ui";
import type { ParsedProfile } from "@/lib/types";

type DashboardData = {
  user: {
    name: string;
    email: string;
    profile: ParsedProfile;
    profileReadiness: number;
  };
  applications: Array<{
    id: string;
    status: string;
    job: { title: string; company: string };
    pack: unknown | null;
    interview: unknown | null;
  }>;
  health: {
    services: Array<{ key: string; label: string; status: string; message: string }>;
  };
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [me, applications, health] = await Promise.all([
      fetch("/api/auth/me").then((response) => response.json()),
      fetch("/api/applications").then((response) => response.json()),
      fetch("/api/health").then((response) => response.json()),
    ]);
    setData({
      user: me.user,
      applications: applications.applications || [],
      health,
    });
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading || !data) {
    return <div className="text-sm text-stone-500">Loading workspace...</div>;
  }

  const applied = data.applications.filter((application) => application.status === "applied").length;
  const packs = data.applications.filter((application) => application.pack).length;
  const interviews = data.applications.filter((application) => application.interview).length;
  const failing = data.health.services.filter((service) => ["failed", "missing_config"].includes(service.status));

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-stone-600">
            One place to move from profile to job match, application pack, tracker, and interview prep.
          </p>
        </div>
        <Button variant="secondary" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Panel>
          <div className="flex items-center justify-between">
            <div className="text-sm text-stone-500">Profile readiness</div>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-semibold">{data.user.profileReadiness}%</div>
          <div className="mt-3">
            <ProgressBar value={data.user.profileReadiness} />
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between">
            <div className="text-sm text-stone-500">Tracked roles</div>
            <ListChecks className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-3 text-3xl font-semibold">{data.applications.length}</div>
          <div className="mt-2 text-sm text-stone-500">{applied} marked applied</div>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between">
            <div className="text-sm text-stone-500">Application packs</div>
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 text-3xl font-semibold">{packs}</div>
          <div className="mt-2 text-sm text-stone-500">Evidence-backed drafts</div>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between">
            <div className="text-sm text-stone-500">Interview prep</div>
            <BriefcaseBusiness className="h-4 w-4 text-stone-600" />
          </div>
          <div className="mt-3 text-3xl font-semibold">{interviews}</div>
          <div className="mt-2 text-sm text-stone-500">Role-specific sets</div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Next best actions</h2>
            <Badge tone={data.user.profileReadiness >= 75 ? "green" : "amber"}>
              {data.user.profileReadiness >= 75 ? "Ready to apply" : "Profile needs work"}
            </Badge>
          </div>
          <div className="grid gap-3">
            <Link className="rounded-md border border-stone-200 p-3 text-sm hover:bg-stone-50" href="/profile">
              Tighten profile evidence before generating tailored claims.
            </Link>
            <Link className="rounded-md border border-stone-200 p-3 text-sm hover:bg-stone-50" href="/jobs">
              Search Singapore internship roles and run fit analysis.
            </Link>
            <Link className="rounded-md border border-stone-200 p-3 text-sm hover:bg-stone-50" href="/applications">
              Move saved roles through preparing, applied, follow-up, and interview statuses.
            </Link>
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold">API health</h2>
          </div>
          <div className="grid gap-2">
            {data.health.services.slice(0, 6).map((service) => (
              <div key={service.key} className="flex items-center justify-between gap-3 rounded-md border border-stone-100 p-2">
                <div>
                  <div className="text-sm font-medium">{service.label}</div>
                  <div className="text-xs text-stone-500">{service.message}</div>
                </div>
                <Badge tone={statusTone(service.status)}>{service.status}</Badge>
              </div>
            ))}
          </div>
          {failing.length ? <div className="mt-3 text-xs text-stone-500">Missing keys are expected until `.env` is filled.</div> : null}
        </Panel>
      </div>
    </div>
  );
}
