"use client";

import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, Field, Panel, inputClass } from "@/components/ui";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");

    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    setPending(false);

    if (!response.ok) {
      setError(payload?.error || "Could not send the reset email.");
      return;
    }

    setNotice(payload?.message || "Check your email for a password reset link.");
  }

  return (
    <Panel className="w-full max-w-md p-6">
      <div className="mb-6 grid gap-2">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-stone-950 text-white">
          <Mail className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm leading-6 text-stone-600">
          Enter your account email and ApplyOS will send a secure reset link.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        {error ? <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
        {notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send reset link"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <div className="mt-5 text-sm text-stone-600">
        Remembered it?{" "}
        <Link className="font-medium text-stone-950 underline underline-offset-4" href="/login">
          Sign in
        </Link>
      </div>
    </Panel>
  );
}

