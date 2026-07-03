import { NextResponse } from "next/server";

import { withApiErrors } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { normalizeStoredJob, toScoredJob } from "@/lib/jobs";
import { serializeAnalysis, serializeApplication } from "@/lib/serializers";

export const GET = withApiErrors(async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await context.params;
  await ensureDatabase();

  const job = await prisma.jobListing.findUnique({
    where: { id },
    include: {
      analyses: {
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      applications: {
        where: { userId: user.id },
        include: {
          jobListing: true,
          fitAnalysis: true,
          applicationPack: true,
          interviewPrep: true,
        },
        take: 1,
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({
    job: toScoredJob(user.profile, job, job.applications),
    raw: normalizeStoredJob(job),
    analysis: job.analyses[0] ? serializeAnalysis(job.analyses[0]) : null,
    application: job.applications[0] ? serializeApplication(job.applications[0]) : null,
  });
});
