import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (
  buffer: Buffer,
) => Promise<{ text: string }>;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parsed = await pdfParse(buffer);
  const text = parsed.text ?? "";

  // Truncate to 20,000 characters as per spec
  return text.slice(0, 20000);
}
