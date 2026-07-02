import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Paths, Directory, File } from "expo-file-system";
import { buildDocumentHtml } from "./documentHtml";

function mimeTypeFor(file: File): string {
  const extension = (file.extension || "").toLowerCase().replace(/^\./, "");
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  return "image/jpeg";
}

async function toDataUri(uri: string): Promise<string> {
  const file = new File(uri);
  return `data:${mimeTypeFor(file)};base64,${await file.base64()}`;
}

function scansDirFor(): Directory {
  return new Directory(Paths.document, "scans");
}

function sourceDirFor(id: string): Directory {
  return new Directory(scansDirFor(), id, "source");
}

export function pdfPathFor(id: string): string {
  return new File(scansDirFor(), `${id}.pdf`).uri;
}

// The scanned page images for a document are persisted exactly once, the
// first time ANY export (PDF or Images) happens for that id, and are kept
// permanently from then on. Both formats are just different outputs
// derived from this one source, which is what makes it possible to add
// the missing format to an already-saved doc later without rescanning.
async function ensureSourcePages(id: string, pages?: string[]): Promise<string[]> {
  const sourceDir = sourceDirFor(id);

  if (sourceDir.exists) {
    const existing = sourceDir
      .list()
      .filter((entry): entry is File => entry instanceof File)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (existing.length > 0) {
      return existing.map((f) => f.uri);
    }
  }

  if (!pages || pages.length === 0) {
    throw new Error(
      "The original scanned pages for this document are no longer available. Please rescan.",
    );
  }

  scansDirFor().create({ intermediates: true, idempotent: true });
  sourceDir.create({ intermediates: true, idempotent: true });

  const persisted: string[] = [];
  for (let i = 0; i < pages.length; i++) {
    const src = new File(pages[i]);
    const ext = (src.extension || ".jpg").replace(/^\./, "") || "jpg";
    const dest = new File(sourceDir, `page-${String(i + 1).padStart(3, "0")}.${ext}`);
    try {
      await src.copy(dest);
    } catch {
      await dest.write(await src.bytes());
    }
    persisted.push(dest.uri);
  }
  return persisted;
}

// pages is optional: pass freshly scanned page URIs on first export for a
// document, or omit it to (re)generate from an already-persisted source.
export async function generatePdf(
  id: string,
  docName: string,
  pages?: string[],
): Promise<string> {
  const sourceUris = await ensureSourcePages(id, pages);
  const html = buildDocumentHtml(await Promise.all(sourceUris.map(toDataUri)), docName);
  const { uri: tmpUri } = await Print.printToFileAsync({ html });

  const scansDir = scansDirFor();
  scansDir.create({ intermediates: true, idempotent: true });

  const destFile = new File(scansDir, `${id}.pdf`);
  if (destFile.exists) destFile.delete();
  await new File(tmpUri).move(destFile);

  return destFile.uri;
}

// Images ARE the persisted source pages — nothing extra to generate, just
// ensure the source exists and hand back its file URIs.
export async function generateImages(id: string, pages?: string[]): Promise<string[]> {
  return ensureSourcePages(id, pages);
}

export async function shareExportedFile(uri: string, mimeType: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error("Sharing is not available on this device");
  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: "Share file",
    UTI: mimeType === "application/pdf" ? "com.adobe.pdf" : undefined,
  });
}