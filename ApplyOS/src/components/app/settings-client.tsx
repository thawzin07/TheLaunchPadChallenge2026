"use client";

import { RefreshCw, ServerCog } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, Button, Panel, statusTone } from "@/components/ui";

type HealthService = {
  key: string;
  label: string;
  status: string;
  message: string;
};

export function SettingsClient() {
  const [services, setServices] = useState<HealthService[]>([]);
  const [checkedAt, setCheckedAt] = useState("");

  async function load() {
    const payload = await fetch("/api/health").then((response) => response.json());
    setServices(payload.services || []);
    setCheckedAt(payload.checkedAt);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings and API Health</h1>
          <p className="mt-1 text-sm text-stone-600">Connector readiness without exposing secrets in the UI.</p>
        </div>
        <Button variant="secondary" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Check
        </Button>
      </div>

      <Panel>
        <div className="mb-4 flex items-center gap-2">
          <ServerCog className="h-4 w-4" />
          <h2 className="font-semibold">Runtime Services</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div key={service.key} className="rounded-md border border-stone-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium">{service.label}</div>
                <Badge tone={statusTone(service.status)}>{service.status}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-600">{service.message}</p>
            </div>
          ))}
        </div>
        {checkedAt ? <div className="mt-4 text-xs text-stone-500">Last checked {new Date(checkedAt).toLocaleString()}</div> : null}
      </Panel>

      <Panel>
        <h2 className="font-semibold">Environment keys expected</h2>
        <div className="mt-3 grid gap-2 text-sm text-stone-700 md:grid-cols-2">
          <code className="rounded-md bg-stone-100 p-3">OPENAI_API_KEY</code>
          <code className="rounded-md bg-stone-100 p-3">AGNES_API_KEY / AGNES_API_BASE_URL</code>
          <code className="rounded-md bg-stone-100 p-3">GMI_API_KEY / GMI_API_BASE_URL</code>
          <code className="rounded-md bg-stone-100 p-3">ADZUNA_APP_ID / ADZUNA_APP_KEY</code>
          <code className="rounded-md bg-stone-100 p-3">GREENHOUSE_BOARD_TOKENS</code>
          <code className="rounded-md bg-stone-100 p-3">LEVER_COMPANY_HANDLES</code>
        </div>
      </Panel>
    </div>
  );
}
