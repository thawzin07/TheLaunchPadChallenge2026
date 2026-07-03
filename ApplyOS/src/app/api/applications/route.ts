import { NextResponse } from "next/server";
import { z } from "zod";

import { withApiErrors } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { serializeApplication } from "@/lib/serializers";

const createApplicationSchema = z.object({
  jobId: z.string().min(1),
  fitAnalysisId: z.string().optional(),
});

export const GET = withApiErrors(async () => {
  const user = await requireUser();
  await ensureDatabase();

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      jobListing: true,
      fitAnalysis: true,
      applicationPack: true,
      interviewPrep: true,
    },
  });

  return NextResponse.json({
    applications: applications.map(serializeApplication),
  });
});

export const POST = withApiErrors(async (request: Request) => {
  const user = await requireUser();
  const input = createApplicationSchema.parse(await request.json());
  await ensureDatabase();

  const job = await prisma.jobListing.findUnique({ where: { id: input.jobId } });
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const application = await prisma.application.upsert({
    where: {
      userId_jobListingId: {
        userId: user.id,
        jobListingId: job.id,
      },
    },
    update: {
      fitAnalysisId: input.fitAnalysisId,
      sourceUrl: job.sourceUrl,
    },
    create: {
      userId: user.id,
      jobListingId: job.id,
      fitAnalysisId: input.fitAnalysisId,
      sourceUrl: job.sourceUrl,
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
