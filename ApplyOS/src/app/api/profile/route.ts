import { NextResponse } from "next/server";
import { z } from "zod";

import { withApiErrors } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { parseProfile, serializeProfile } from "@/lib/profile";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import type { NextRequest } from "next/server";
import type { EvidenceItem, ParsedProfile } from "@/lib/types";

const evidenceSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  tags: z.array(z.string()),
});

const profileSchema: z.ZodType<ParsedProfile> = z.object({
  headline: z.string().max(200),
  summary: z.string().max(2000),
  resumeText: z.string().max(12000),
  education: z.array(z.string()),
  skills: z.array(z.string()),
  projects: z.array(evidenceSchema) as z.ZodType<EvidenceItem[]>,
  experience: z.array(evidenceSchema) as z.ZodType<EvidenceItem[]>,
  certifications: z.array(z.string()),
  coursework: z.array(z.string()),
  preferences: z.object({
    targetRoles: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    workModes: z.array(z.string()).optional(),
  }),
  evidence: z.array(evidenceSchema) as z.ZodType<EvidenceItem[]>,
});

export const GET = withApiErrors(async () => {
  const user = await requireUser();
  await ensureDatabase();
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ profile: parseProfile(profile) });
});

export const PUT = withApiErrors(async (request: NextRequest) => {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const user = await requireUser();
  const input = profileSchema.parse(await request.json());
  await ensureDatabase();

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: serializeProfile(input),
    create: {
      userId: user.id,
      ...serializeProfile(input),
    },
  });

  return NextResponse.json({ profile: parseProfile(profile) });
});
