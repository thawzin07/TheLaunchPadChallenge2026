import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase-ssr";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));

  const successUrl = request.nextUrl.clone();
  successUrl.pathname = nextPath;
  successUrl.search = "";

  const successResponse = NextResponse.redirect(successUrl);

  if (tokenHash && type) {
    const supabase = createSupabaseRouteClient(request, successResponse);
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) return successResponse;
  }

  const failureUrl = request.nextUrl.clone();
  failureUrl.pathname = "/login";
  failureUrl.search = "";
  failureUrl.searchParams.set("error", "confirmation_failed");
  return NextResponse.redirect(failureUrl);
}
