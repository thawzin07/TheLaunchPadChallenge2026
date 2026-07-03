import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureDatabase, prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";
import type { NextRequest } from "next/server";

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

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

function canUseSignupFallback(errorMessage?: string) {
  return (
    process.env.AUTH_ALLOW_UNVERIFIED_SIGNUP_FALLBACK === "true" &&
    Boolean(errorMessage?.toLowerCase().includes("email rate limit"))
  );
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });

  try {
    const input = signupSchema.parse(await request.json());
    const email = input.email.toLowerCase().trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const emailRedirectTo = new URL("/auth/confirm?next=/dashboard", appUrl).toString();
    const supabase = createSupabaseRouteClient(request, response);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        emailRedirectTo,
        data: { name: input.name.trim() },
      },
    });

    let authUser = data.user;
    let session = data.session;
    let usedUnverifiedFallback = false;

    if (error && canUseSignupFallback(error.message)) {
      const admin = getSupabaseAdmin();
      const created = await admin.auth.admin.createUser({
        email,
        password: input.password,
        email_confirm: true,
        user_metadata: { name: input.name.trim() },
      });

      if (created.error || !created.data.user?.id || !created.data.user.email) {
        return NextResponse.json({ error: created.error?.message || "Could not create account." }, { status: 400 });
      }

      const signedIn = await supabase.auth.signInWithPassword({
        email,
        password: input.password,
      });

      if (signedIn.error || !signedIn.data.user?.id || !signedIn.data.user.email) {
        return NextResponse.json({ error: signedIn.error?.message || "Could not sign in." }, { status: 401 });
      }

      authUser = signedIn.data.user;
      session = signedIn.data.session;
      usedUnverifiedFallback = true;
    }

    if (error && !usedUnverifiedFallback) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!authUser?.id || !authUser.email) {
      return NextResponse.json({ error: "Could not create account." }, { status: 400 });
    }

    await ensureDatabase();
    const user = await prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email,
        name: input.name.trim(),
      },
      create: {
        id: authUser.id,
        name: input.name.trim(),
        email,
        profile: { create: {} },
      },
    });

    return withAuthCookies(response, {
      user: { id: user.id, email: user.email, name: user.name },
      needsEmailConfirmation: !session,
      emailConfirmationBypassed: usedUnverifiedFallback,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Check your signup details and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
