import { NextResponse } from "next/server";

import { withApiErrors } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";

function safeDownloadName(fileName: string) {
  const clean = fileName.replace(/["\\\r\n]/g, "_").trim();
  return clean || "resume";
}

export const GET = withApiErrors(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await params;
    await ensureDatabase();

    const resume = await prisma.resumeFile.findFirst({
      where: { id, userId: user.id },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();
    const download = await supabase.storage.from(resume.bucket).download(resume.path);

    if (download.error || !download.data) {
      return NextResponse.json({ error: "Could not open this resume." }, { status: 502 });
    }

    return new NextResponse(download.data, {
      headers: {
        "cache-control": "no-store",
        "content-disposition": `inline; filename="${safeDownloadName(resume.fileName)}"`,
        "content-type": resume.contentType || "application/octet-stream",
        "x-content-type-options": "nosniff",
      },
    });
  },
);
