import { NextResponse } from "next/server";
import { z } from "zod";

import { withApiErrors } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { serializeApplication } from "@/lib/serializers";

const updateApplicationSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  appliedAt: z.string().nullable().optional(),
  followUpAt: z.string().nullable().optional(),
  interviewAt: z.string().nullable().optional(),
});

function parseNullableDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const PATCH = withApiErrors(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await context.params;
  const input = updateApplicationSchema.parse(await request.json());
  await ensureDatabase();

  const application = await prisma.application.update({
    where: {
      id,
      userId: user.id,
    },
    data: {
      status: input.status,
      notes: input.notes,
      outcome: input.outcome,
      appliedAt: input.appliedAt === undefined ? undefined : parseNullableDate(input.appliedAt),
      followUpAt: input.followUpAt === undefined ? undefined : parseNullableDate(input.followUpAt),
      interviewAt: input.interviewAt === undefined ? undefined : parseNullableDate(input.interviewAt),
    },
    include: {
      jobListing: true,
      fitAnalysis: true,
      applicationPack: true,
      interviewPrep: true,
    },
  });

  return NextResponse.json({ application: serializeApplication(application) });
});
