"use client";

import { ArrowRight, Loader2, LockKeyhole, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SessionToast, ToastNotice, setNextToast, useToast } from "@/components/toast";
import { Button, Field, Panel, inputClass } from "@/components/ui";
import { getPasswordPolicyError, PASSWORD_POLICY_HINT } from "@/lib/password-policy";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    showToast(mode === "signup" ? "Creating your account..." : "Signing you in...", "loading");

    if (mode === "signup") {
      const passwordError = getPasswordPolicyError(password, { email, name });
      if (passwordError) {
        setError(passwordError);
        showToast(passwordError, "error");
        setPending(false);
        return;
      }
    }

    const response = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      const message = payload?.error || "Authentication failed.";
      setError(message);
      showToast(message, "error");
      setPending(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as { needsEmailConfirmation?: boolean } | null;

    if (payload?.needsEmailConfirmation) {
      setNotice("Account created. Check your email to confirm before signing in.");
      showToast("Account created. Check your email to confirm before signing in.", "success");
      setPending(false);
      return;
    }

    setNextToast(mode === "signup" ? "Account created. You are signed in." : "Signed in.", "success");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Panel className="w-full max-w-md p-6">
      <SessionToast />
      <ToastNotice toast={toast} onDismiss={clearToast} />
      <div className="mb-6 grid gap-2">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-stone-950 text-white">
          {mode === "signup" ? <UserPlus className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signup" ? "Create your ApplyOS account" : "Sign in to ApplyOS"}
        </h1>
        <p className="text-sm leading-6 text-stone-600">
          Your profile, applications, generated drafts, and interview prep stay tied to your private account.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        {mode === "signup" ? (
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
        ) : null}
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Password" hint={mode === "signup" ? PASSWORD_POLICY_HINT : undefined}>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        {error ? <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
        {notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "signup" ? "Creating account" : "Signing in"}
            </>
          ) : (
            <>
              {mode === "signup" ? "Create account" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      <div className="mt-5 text-sm text-stone-600">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link className="font-medium text-stone-950 underline underline-offset-4" href="/login">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link className="font-medium text-stone-950 underline underline-offset-4" href="/sign-up">
              Create an account
            </Link>
            <span className="mx-2 text-stone-300">/</span>
            <Link className="font-medium text-stone-950 underline underline-offset-4" href="/forgot-password">
              Reset password
            </Link>
          </>
        )}
      </div>
    </Panel>
  );
}
