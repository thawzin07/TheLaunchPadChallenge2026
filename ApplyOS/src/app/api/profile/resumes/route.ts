import { NextResponse } from "next/server";

import { withApiErrors } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { NextRequest } from "next/server";

function serializeResume(input: {
  id: string;
  bucket: string;
  path: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  extractedText: string;
  createdAt: Date;
}) {
  return {
    id: input.id,
    fileName: input.fileName,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    extractedTextAvailable: Boolean(input.extractedText),
    extractedTextPreview: input.extractedText.slice(0, 500),
    createdAt: input.createdAt.toISOString(),
    downloadUrl: `/api/profile/resumes/${input.id}/download`,
  };
}

export const GET = withApiErrors(async () => {
  const user = await requireUser();
  await ensureDatabase();

  const resumes = await prisma.resumeFile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ resumes: resumes.map(serializeResume) });
});

export const DELETE = withApiErrors(async (request: NextRequest) => {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const user = await requireUser();
  await ensureDatabase();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Resume id is required." }, { status: 400 });
  }

  const resume = await prisma.resumeFile.findFirst({
    where: { id, userId: user.id },
  });

  if (!resume) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  await supabase.storage.from(resume.bucket).remove([resume.path]);
  await prisma.resumeFile.delete({ where: { id: resume.id } });

  return NextResponse.json({ ok: true });
});
