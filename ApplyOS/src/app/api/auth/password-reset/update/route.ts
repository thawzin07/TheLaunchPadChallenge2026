import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseRouteClient } from "@/lib/supabase-ssr";

const resetUpdateSchema = z.object({
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
    const input = resetUpdateSchema.parse(await request.json());
    const supabase = createSupabaseRouteClient(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Open the latest reset link before choosing a new password." }, { status: 401 });
    }

    const { error } = await supabase.auth.updateUser({ password: input.password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return withAuthCookies(response, { message: "Password updated." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update your password." }, { status: 500 });
  }
}

