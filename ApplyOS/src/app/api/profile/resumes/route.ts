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
  signedUrl?: string | null;
}) {
  return {
    id: input.id,
    bucket: input.bucket,
    path: input.path,
    fileName: input.fileName,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    extractedTextAvailable: Boolean(input.extractedText),
    extractedTextPreview: input.extractedText.slice(0, 500),
    createdAt: input.createdAt.toISOString(),
    signedUrl: input.signedUrl ?? null,
  };
}

export const GET = withApiErrors(async () => {
  const user = await requireUser();
  await ensureDatabase();

  const resumes = await prisma.resumeFile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const supabase = getSupabaseAdmin();
  const signed = await Promise.all(
    resumes.map(async (resume) => {
      const url = await supabase.storage.from(resume.bucket).createSignedUrl(resume.path, 60 * 60);
      return serializeResume({
        ...resume,
        signedUrl: url.data?.signedUrl ?? null,
      });
    }),
  );

  return NextResponse.json({ resumes: signed });
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
