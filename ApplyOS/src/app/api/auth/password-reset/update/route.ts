import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getPasswordPolicyError } from "@/lib/password-policy";
import { checkRateLimit, makeRateLimitKey } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";

const resetUpdateSchema = z.object({
  password: z.string().min(1).max(128),
});

const RESET_UPDATE_WINDOW_MS = 15 * 60 * 1000;

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
    key: makeRateLimitKey(request, "password-reset-update"),
    limit: 20,
    windowMs: RESET_UPDATE_WINDOW_MS,
  });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many password update attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } },
    );
  }

  const response = NextResponse.json({ ok: true });

  try {
    const input = resetUpdateSchema.parse(await request.json());
    const supabase = createSupabaseRouteClient(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Open the latest reset link before choosing a new password." }, { status: 401 });
    }

    const passwordError = getPasswordPolicyError(input.password, { email: user.email });
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({ password: input.password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return withAuthCookies(response, { message: "Password updated." });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Check the new password and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update your password." }, { status: 500 });
  }
}
