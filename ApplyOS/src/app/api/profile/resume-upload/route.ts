import { NextResponse } from "next/server";

import { withApiErrors } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { parseProfile, serializeProfile } from "@/lib/profile";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { extractResumeText } from "@/lib/resume";
import { getStorageBucket, getSupabaseAdmin } from "@/lib/supabase";
import type { NextRequest } from "next/server";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

function safeFileName(fileName: string) {
  const fallback = "resume";
  const clean = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || fallback;
}

export const POST = withApiErrors(async (request: NextRequest) => {
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;

  const user = await requireUser();
  await ensureDatabase();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a resume file." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Resume file must be 8MB or smaller." }, { status: 400 });
  }

  if (file.type && !ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use PDF, DOC, DOCX, or TXT." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const bucket = getStorageBucket();
    const path = `users/${user.id}/resume/${Date.now()}-${safeFileName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 502 });
    }

    const extractedText = await extractResumeText({
      buffer,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    });
    const current = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    const profile = parseProfile(current);
    const evidenceItem = {
      id: `resume-${Date.now()}`,
      label: "Uploaded resume",
      detail: extractedText
        ? `${file.name} was uploaded and its text is ready for tailoring.`
        : `${file.name} was uploaded securely. Paste key resume text below if you want stronger tailoring for this file.`,
      tags: extractedText ? ["Resume", "Text extracted"] : ["Resume", "Private upload"],
    };
    const nextProfile = {
      ...profile,
      resumeText: extractedText || profile.resumeText,
      evidence: [evidenceItem, ...profile.evidence].slice(0, 24),
    };

    const [saved, resume] = await prisma.$transaction([
      prisma.userProfile.upsert({
        where: { userId: user.id },
        update: serializeProfile(nextProfile),
        create: {
          userId: user.id,
          ...serializeProfile(nextProfile),
        },
      }),
      prisma.resumeFile.create({
        data: {
          userId: user.id,
          bucket,
          path,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          extractedText,
        },
      }),
    ]);

    const resumes = await prisma.resumeFile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      file: {
        id: resume.id,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        extractedTextAvailable: Boolean(extractedText),
        downloadUrl: `/api/profile/resumes/${resume.id}/download`,
      },
      profile: parseProfile(saved),
      resumes: resumes.map((item) => ({
        id: item.id,
        fileName: item.fileName,
        contentType: item.contentType,
        sizeBytes: item.sizeBytes,
        extractedTextAvailable: Boolean(item.extractedText),
        extractedTextPreview: item.extractedText.slice(0, 500),
        createdAt: item.createdAt.toISOString(),
        downloadUrl: `/api/profile/resumes/${item.id}/download`,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not upload resume.",
      },
      { status: 500 },
    );
  }
});
