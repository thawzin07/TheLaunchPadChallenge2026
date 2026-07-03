import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { checkRateLimit, makeRateLimitKey } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";

const resetRequestSchema = z.object({
  email: z.string().email(),
});

const RESET_REQUEST_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const ipLimit = checkRateLimit({
    key: makeRateLimitKey(request, "password-reset-request"),
    limit: 30,
    windowMs: RESET_REQUEST_WINDOW_MS,
  });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many reset requests. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } },
    );
  }

  const response = NextResponse.json({ ok: true });

  try {
    const input = resetRequestSchema.parse(await request.json());
    const email = input.email.toLowerCase().trim();
    const subjectLimit = checkRateLimit({
      key: makeRateLimitKey(request, "password-reset-request", email),
      limit: 3,
      windowMs: RESET_REQUEST_WINDOW_MS,
    });
    if (!subjectLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset requests for this email. Try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(subjectLimit.retryAfterSeconds) } },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectTo = new URL("/auth/confirm?next=/reset-password", appUrl).toString();
    const supabase = createSupabaseRouteClient(request, response);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      const rateLimited = error.message.toLowerCase().includes("rate limit");
      return NextResponse.json(
        { error: rateLimited ? "Too many reset emails requested. Try again later." : "Could not send the reset email." },
        { status: rateLimited ? 429 : 400 },
      );
    }

    return NextResponse.json({
      message: "If this email belongs to an ApplyOS account, a reset link has been sent.",
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not send the reset email." }, { status: 500 });
  }
}
