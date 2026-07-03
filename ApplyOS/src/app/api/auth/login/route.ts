import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureDatabase, prisma } from "@/lib/db";
import { checkRateLimit, makeRateLimitKey } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";
import type { NextRequest } from "next/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function withAuthCookies(source: NextResponse, body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    response.cookies.set(name, value, options);
  });
  ["cache-control", "expires", "pragma"].forEach((header) => {
    const value = source.headers.get(header);
    if (value) response.headers.set(header, value);
  });
  return response;
}

export async function POST(request: NextRequest) {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const ipLimit = checkRateLimit({
    key: makeRateLimitKey(request, "login"),
    limit: 60,
    windowMs: LOGIN_WINDOW_MS,
  });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } },
    );
  }

  const response = NextResponse.json({ ok: true });

  try {
    const input = loginSchema.parse(await request.json());
    const email = input.email.toLowerCase().trim();
    const subjectLimit = checkRateLimit({
      key: makeRateLimitKey(request, "login", email),
      limit: 10,
      windowMs: LOGIN_WINDOW_MS,
    });
    if (!subjectLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts for this email. Try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(subjectLimit.retryAfterSeconds) } },
      );
    }

    const supabase = createSupabaseRouteClient(request, response);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (error || !data.user?.id || !data.user.email) {
      return NextResponse.json({ error: error?.message || "Invalid email or password." }, { status: 401 });
    }

    await ensureDatabase();
    const user = await prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        email: data.user.email,
        name:
          typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name.trim()
            ? data.user.user_metadata.name.trim()
            : data.user.email.split("@")[0],
      },
      create: {
        id: data.user.id,
        email: data.user.email,
        name:
          typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name.trim()
            ? data.user.user_metadata.name.trim()
            : data.user.email.split("@")[0],
        profile: { create: {} },
      },
    });

    return withAuthCookies(response, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Check your login details and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not sign in." }, { status: 500 });
  }
}
