import { NextRequest, NextResponse } from "next/server";

import { withApiErrors } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { discoverJobs, toScoredJob, upsertJobs } from "@/lib/jobs";

export const GET = withApiErrors(async (request: NextRequest) => {
  const user = await requireUser();
  await ensureDatabase();

  const query =
    request.nextUrl.searchParams.get("query") ||
    user.profile.preferences.targetRoles?.[0] ||
    "software engineer intern";
  const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "18", 10);
  const fresh = request.nextUrl.searchParams.get("fresh") !== "false";

  const discovery = fresh
    ? await discoverJobs(query, Math.min(Math.max(limit, 6), 30))
    : { jobs: [], statuses: [] };
  const stored = discovery.jobs.length ? await upsertJobs(discovery.jobs) : [];
  const fallbackStored = stored.length
    ? stored
    : await prisma.jobListing.findMany({
        orderBy: { fetchedAt: "desc" },
        take: limit,
      });
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    select: { jobListingId: true },
  });

  return NextResponse.json({
    query,
    statuses: discovery.statuses,
    jobs: fallbackStored.map((job) => toScoredJob(user.profile, job, applications)),
  });
});
