import { NextResponse } from "next/server";

import { withApiErrors } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { demoProfile, parseProfile, serializeProfile } from "@/lib/profile";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import type { NextRequest } from "next/server";

export const POST = withApiErrors(async (request: NextRequest) => {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const user = await requireUser();
  await ensureDatabase();

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: serializeProfile(demoProfile),
    create: {
      userId: user.id,
      ...serializeProfile(demoProfile),
    },
  });

  return NextResponse.json({ profile: parseProfile(profile) });
});
