import { NextResponse, type NextRequest } from "next/server";

function normalizeOrigin(value: string) {
  return new URL(value).origin;
}

export function rejectUntrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  try {
    const requestOrigin = normalizeOrigin(request.nextUrl.origin);
    const allowedOrigins = new Set([requestOrigin]);
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (configuredAppUrl) {
      allowedOrigins.add(normalizeOrigin(configuredAppUrl));
    }

    if (!allowedOrigins.has(normalizeOrigin(origin))) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  return null;
}
