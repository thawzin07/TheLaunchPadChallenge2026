import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthError } from "@/lib/auth";

export function apiErrorResponse(error: unknown, fallback = "Request failed.") {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Check the request details and try again." }, { status: 400 });
  }

  if (error instanceof Error && error.message.includes("Record to update not found")) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      error: error instanceof Error && error.message ? error.message : fallback,
    },
    { status: 500 },
  );
}

export function withApiErrors<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}
