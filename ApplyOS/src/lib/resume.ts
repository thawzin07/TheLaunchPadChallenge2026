const MAX_EXTRACTED_TEXT = 12000;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extensionFromName(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

export async function extractResumeText(input: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}) {
  const type = input.contentType.toLowerCase();
  const extension = extensionFromName(input.fileName);

  try {
    if (type === "text/plain" || extension === "txt") {
      return input.buffer.toString("utf8").slice(0, MAX_EXTRACTED_TEXT);
    }

    if (type === "application/pdf" || extension === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: input.buffer });
      try {
        const result = await parser.getText();
        return normalizeWhitespace(result.text).slice(0, MAX_EXTRACTED_TEXT);
      } finally {
        await parser.destroy();
      }
    }

    if (
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === "docx"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: input.buffer });
      return normalizeWhitespace(result.value).slice(0, MAX_EXTRACTED_TEXT);
    }
  } catch {
    return "";
  }

  return "";
}
