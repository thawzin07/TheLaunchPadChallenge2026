import { NextResponse } from "next/server";

import { rejectUntrustedOrigin } from "@/lib/request-security";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteClient(request, response);
  await supabase.auth.signOut();
  return response;
}
