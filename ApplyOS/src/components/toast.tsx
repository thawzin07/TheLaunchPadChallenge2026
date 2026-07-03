"use client";

import { CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/components/ui";

export type ToastTone = "info" | "success" | "error" | "loading";

export type ToastState = {
  message: string;
  tone?: ToastTone;
};

const storageKey = "applyos:toast";

function iconFor(tone: ToastTone) {
  if (tone === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (tone === "error") return <XCircle className="h-4 w-4 text-rose-600" />;
  if (tone === "loading") return <Loader2 className="h-4 w-4 animate-spin text-stone-600" />;
  return <Info className="h-4 w-4 text-sky-600" />;
}

export function setNextToast(message: string, tone: ToastTone = "info") {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(storageKey, JSON.stringify({ message, tone }));
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToast({ message, tone });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast || toast.tone === "loading") return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return {
    toast,
    showToast,
    clearToast,
  };
}

export function SessionToast() {
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) return;
    window.sessionStorage.removeItem(storageKey);

    try {
      const parsed = JSON.parse(stored) as ToastState;
      if (parsed.message) showToast(parsed.message, parsed.tone || "info");
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [showToast]);

  return <ToastNotice toast={toast} onDismiss={clearToast} />;
}

export function ToastNotice({
  toast,
  onDismiss,
}: {
  toast: ToastState | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  const tone = toast.tone || "info";
  const toneClasses = {
    info: "border-sky-200 bg-white text-stone-900",
    success: "border-emerald-200 bg-white text-stone-900",
    error: "border-rose-200 bg-white text-stone-900",
    loading: "border-stone-200 bg-white text-stone-900",
  };

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border p-3 text-sm shadow-lg animate-toast-in",
        toneClasses[tone],
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="mt-0.5">{iconFor(tone)}</div>
      <div className="min-w-0 flex-1 leading-5">{toast.message}</div>
      <button
        type="button"
        className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
