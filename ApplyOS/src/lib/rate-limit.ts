import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

const globalStore = globalThis as typeof globalThis & {
  __applyosRateLimitStore?: RateLimitStore;
};

const store = globalStore.__applyosRateLimitStore ?? new Map<string, RateLimitEntry>();
globalStore.__applyosRateLimitStore = store;

function cleanKeyPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9@._:-]+/g, "").slice(0, 160) || "unknown";
}

function clientAddress(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function makeRateLimitKey(request: NextRequest, scope: string, subject = "") {
  return [scope, clientAddress(request), subject].map(cleanKeyPart).join(":");
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();

  for (const [entryKey, entry] of store) {
    if (entry.resetAt <= now) store.delete(entryKey);
  }

  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, retryAfterSeconds: 0 };
}
