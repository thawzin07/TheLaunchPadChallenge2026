import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureDatabase, prisma } from "@/lib/db";
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

    if (error || !data.user?.id || !data.user.email) {
      return NextResponse.json({ error: error?.message || "Could not create account." }, { status: 400 });
    }

    await ensureDatabase();
    const user = await prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        email,
        name: input.name.trim(),
      },
      create: {
        id: data.user.id,
        name: input.name.trim(),
        email,
        profile: { create: {} },
      },
    });

    return withAuthCookies(response, {
      user: { id: user.id, email: user.email, name: user.name },
      needsEmailConfirmation: !data.session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Check your signup details and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
