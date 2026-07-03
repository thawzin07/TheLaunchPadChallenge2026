"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Field, Panel, inputClass } from "@/components/ui";
import { getPasswordPolicyError, PASSWORD_POLICY_HINT } from "@/lib/password-policy";

export function ResetPasswordForm({ canReset, email }: { canReset: boolean; email?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordError = getPasswordPolicyError(password, { email });
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setPending(true);
    const response = await fetch("/api/auth/password-reset/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    setPending(false);

    if (!response.ok) {
      setError(payload?.error || "Could not update your password.");
      return;
    }

    setNotice(payload?.message || "Password updated.");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 700);
  }

  return (
    <Panel className="w-full max-w-md p-6">
      <div className="mb-6 grid gap-2">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-stone-950 text-white">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-sm leading-6 text-stone-600">
          {canReset
            ? `Set a new password${email ? ` for ${email}` : ""}.`
            : "Open the latest reset link from your email before setting a new password."}
        </p>
      </div>
      {canReset ? (
        <form onSubmit={submit} className="grid gap-4">
          <Field label="New password" hint={PASSWORD_POLICY_HINT}>
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <Field label="Confirm password">
            <input
              className={inputClass}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </Field>
          {error ? <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          {notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Updating..." : "Update password"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="grid gap-3">
          <Link className="text-sm font-medium text-stone-950 underline underline-offset-4" href="/forgot-password">
            Request a new reset link
          </Link>
          <Link className="text-sm font-medium text-stone-950 underline underline-offset-4" href="/login">
            Back to sign in
          </Link>
        </div>
      )}
    </Panel>
  );
}
