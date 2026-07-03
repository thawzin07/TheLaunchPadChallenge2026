import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseRouteClient } from "@/lib/supabase-ssr";

const resetRequestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });

  try {
    const input = resetRequestSchema.parse(await request.json());
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectTo = new URL("/auth/confirm?next=/reset-password", appUrl).toString();
    const supabase = createSupabaseRouteClient(request, response);
    const { error } = await supabase.auth.resetPasswordForEmail(input.email.toLowerCase().trim(), {
      redirectTo,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "If this email belongs to an ApplyOS account, a reset link has been sent.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not send the reset email." }, { status: 500 });
  }
}

