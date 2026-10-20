import * as Sharing from "expo-sharing";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { PermissionsAndroid, Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import { Paths, Directory, File } from "expo-file-system";
import { safeFileName, uniqueFileName } from "./fileNames";
import {
  PDF_JPEG_QUALITY,
  PDF_MAX_IMAGE_EDGE,
  PDF_PAGE_WIDTH_PT,
} from "./exportConfig";

export type ExportProgressCallback = (done: number, total: number) => void;
export type PublishedUris = { pdf?: string; images?: Array<string | null> };
export type GeneratedPdf = { uri: string; publishedUri?: string; warning?: string };
export type GeneratedImages = { uris: string[]; publishedUris: Array<string | null>; warning?: string };

function legacyScansDir(): Directory {
  return new Directory(Paths.document, "scans");
}

function privateScansDir(): Directory {
  if (Platform.OS === "ios") {
    const library = ReactNativeBlobUtil.fs.dirs.LibraryDir;
    return new Directory(library.startsWith("file://") ? library : `file://${library}`, "Lens", "scans");
  }
  return legacyScansDir();
}

function sourceDirFor(id: string): Directory {
  return new Directory(privateScansDir(), id, "source");
}

function localPath(uri: string): string {
  return uri.replace(/^file:\/\//, "");
}

function mimeTypeFor(file: File): string {
  const extension = (file.extension || "").toLowerCase().replace(/^\./, "");
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  return "image/jpeg";
}

async function copyFile(source: File, destination: File): Promise<void> {
  destination.parentDirectory.create({ intermediates: true, idempotent: true });
  if (destination.exists) destination.delete();
  await source.copy(destination);
}

async function copyMigrationFile(source: File, destination: File, id: string): Promise<void> {
  const staging = new Directory(privateScansDir(), id, ".migration");
  staging.create({ intermediates: true, idempotent: true });
  const stagedFile = new File(staging, destination.name);
  if (stagedFile.exists) stagedFile.delete();
  await source.copy(stagedFile);
  if (source.size === null || stagedFile.size !== source.size) {
    if (stagedFile.exists) stagedFile.delete();
    throw new Error(`Could not copy ${source.name} completely during document migration.`);
  }
  if (destination.exists) destination.delete();
  await stagedFile.move(destination);
}

/** Copies a page set into durable private storage, one page at a time. */
export async function persistSourcePages(
  id: string,
  pages?: string[],
  expectedPageCount = pages?.length,
): Promise<string[]> {
  const sourceDir = sourceDirFor(id);
  if (sourceDir.exists) {
    const existing = sourceDir
      .list()
      .filter((entry): entry is File => entry instanceof File)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (existing.length > 0 && (expectedPageCount === undefined || existing.length === expectedPageCount)) {
      return existing.map((file) => file.uri);
    }
    if (pages && existing.length > 0 && pages.every((uri) => uri.startsWith(sourceDir.uri))) {
      throw new Error("Some saved scan pages are missing. Please rescan this document.");
    }
    sourceDir.delete();
  }

  if (!pages?.length) {
    throw new Error("The original scanned pages for this document are no longer available. Please rescan.");
  }

  sourceDir.create({ intermediates: true, idempotent: true });
  const persisted: string[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    const source = new File(pages[i]);
    const extension = (source.extension || ".jpg").replace(/^\./, "") || "jpg";
    const destination = new File(sourceDir, `page-${String(i + 1).padStart(3, "0")}.${extension}`);
    await copyFile(source, destination);
    persisted.push(destination.uri);
  }
  return persisted;
}

async function appendText(path: string, value: string): Promise<void> {
  await ReactNativeBlobUtil.fs.appendFile(path, value, "utf8");
}

async function offset(path: string): Promise<number> {
  return Number((await ReactNativeBlobUtil.fs.stat(path)).size);
}

async function preparePdfJpeg(source: File): Promise<{ file: File; width: number; height: number }> {
  const context = ImageManipulator.manipulate(source.uri);
  let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  try {
    image = await context.renderAsync();
    const longEdge = Math.max(image.width, image.height);
    if (longEdge > PDF_MAX_IMAGE_EDGE) {
      const resizedWidth = image.width >= image.height ? PDF_MAX_IMAGE_EDGE : null;
      const resizedHeight = image.height > image.width ? PDF_MAX_IMAGE_EDGE : null;
      image.release();
      image = undefined;
      context.reset().resize({ width: resizedWidth, height: resizedHeight });
      image = await context.renderAsync();
    }

    const result = await image.saveAsync({
      format: SaveFormat.JPEG,
      compress: PDF_JPEG_QUALITY,
    });
    return { file: new File(result.uri), width: result.width, height: result.height };
  } finally {
    image?.release();
    context.release();
  }
}

async function createPdf(sourceUris: string[], destination: File, onProgress?: ExportProgressCallback): Promise<void> {
  destination.parentDirectory.create({ intermediates: true, idempotent: true });
  if (destination.exists) destination.delete();
  destination.create({ intermediates: true, overwrite: true });
  const path = localPath(destination.uri);
  const count = sourceUris.length;
  const offsets: number[] = [0];
  const pagesObject = 2;
  const pageObject = (index: number) => 3 + index * 3;
  const imageObject = (index: number) => 4 + index * 3;
  const contentObject = (index: number) => 5 + index * 3;

  let text = "%PDF-1.4\n%Lens\n";
  offsets[1] = text.length;
  text += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  offsets[pagesObject] = text.length;
  text += `2 0 obj\n<< /Type /Pages /Count ${count} /Kids [${sourceUris.map((_, i) => `${pageObject(i)} 0 R`).join(" ")}] >>\nendobj\n`;
  await ReactNativeBlobUtil.fs.writeFile(path, text, "utf8");

  for (let index = 0; index < sourceUris.length; index += 1) {
    const source = new File(sourceUris[index]);
    let pdfPage: File | undefined;
    try {
      const prepared = await preparePdfJpeg(source);
      pdfPage = prepared.file;
      const width = PDF_PAGE_WIDTH_PT;
      const height = (width * prepared.height) / prepared.width;
      const page = pageObject(index);
      const image = imageObject(index);
      const content = contentObject(index);
      let objects = "";
      offsets[page] = (await offset(path)) + objects.length;
      objects += `${page} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width.toFixed(3)} ${height.toFixed(3)}] /Resources << /XObject << /Im${index + 1} ${image} 0 R >> >> /Contents ${content} 0 R >>\nendobj\n`;
      offsets[image] = (await offset(path)) + objects.length;
      const imageSize = Number((await ReactNativeBlobUtil.fs.stat(localPath(pdfPage.uri))).size);
      objects += `${image} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${prepared.width} /Height ${prepared.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageSize} >>\nstream\n`;
      await appendText(path, objects);
      await ReactNativeBlobUtil.fs.appendFile(path, localPath(pdfPage.uri), "uri");
      await appendText(path, "\nendstream\nendobj\n");
      offsets[content] = await offset(path);
      const contentStream = `q\n${width.toFixed(3)} 0 0 ${height.toFixed(3)} 0 0 cm\n/Im${index + 1} Do\nQ\n`;
      await appendText(path, `${content} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);
      onProgress?.(index + 1, count);
    } finally {
      if (pdfPage?.exists) pdfPage.delete();
    }
  }

  const xrefOffset = await offset(path);
  const lastObject = 2 + count * 3;
  let xref = `xref\n0 ${lastObject + 1}\n0000000000 65535 f \n`;
  for (let object = 1; object <= lastObject; object += 1) {
    xref += `${String(offsets[object]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${lastObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  await appendText(path, xref);
}

async function getExistingNames(directory: Directory): Promise<string[]> {
  if (!directory.exists) return [];
  return directory.list().filter((entry): entry is File => entry instanceof File).map((file) => file.name.replace(/\.[^.]+$/, ""));
}

async function publishAndroid(file: File, displayName: string, collection: "Download" | "Image"): Promise<string> {
  if (Number(Platform.Version) <= 28) {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.request(permission, {
      title: "Allow Lens to save exports",
      message: "Lens needs storage access to place exported files in Downloads/Lens or Pictures/Lens.",
      buttonPositive: "Allow",
      buttonNegative: "Cancel",
    });
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) throw new Error("Storage permission was not granted.");
    const sharedRoot = collection === "Download"
      ? ReactNativeBlobUtil.fs.dirs.LegacyDownloadDir
      : ReactNativeBlobUtil.fs.dirs.LegacyPictureDir;
    const directory = `${sharedRoot}/Lens`;
    await ReactNativeBlobUtil.fs.mkdir(directory);
    const names = await ReactNativeBlobUtil.fs.ls(directory);
    const uniqueName = uniqueFileName(displayName.replace(/\.[^.]+$/, ""), names.map((name) => name.replace(/\.[^.]+$/, "")));
    const extension = displayName.match(/\.[^.]+$/)?.[0] ?? "";
    const destination = `${directory}/${uniqueName}${extension}`;
    await ReactNativeBlobUtil.fs.cp(localPath(file.uri), destination);
    return `file://${destination}`;
  }
  const uniqueName = displayName.replace(/\.[^.]+$/, "");
  const extension = displayName.match(/\.[^.]+$/)?.[0] ?? "";
  const result = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
    { name: `${uniqueName}${extension}`, parentFolder: "Lens", mimeType: collection === "Download" ? "application/pdf" : mimeTypeFor(file) },
    collection,
    localPath(file.uri),
  );
  return typeof result === "string" ? result : String(result);
}

async function publishIos(file: File, displayName: string): Promise<string> {
  const directory = new Directory(Paths.document, "Lens");
  directory.create({ intermediates: true, idempotent: true });
  const uniqueName = uniqueFileName(displayName.replace(/\.[^.]+$/, ""), await getExistingNames(directory));
  const extension = displayName.match(/\.[^.]+$/)?.[0] ?? "";
  const destination = new File(directory, `${uniqueName}${extension}`);
  await copyFile(file, destination);
  return destination.uri;
}

export async function generatePdf(
  id: string,
  docName: string,
  pages?: string[],
  expectedPageCount?: number,
  onProgress?: ExportProgressCallback,
): Promise<GeneratedPdf> {
  const sourceUris = await persistSourcePages(id, pages, expectedPageCount);
  const destination = new File(privateScansDir(), `${id}.pdf`);
  await createPdf(sourceUris, destination, onProgress);
  return { uri: destination.uri, ...(await publishPdf(id, docName, destination.uri)) };
}

export async function publishPdf(id: string, docName: string, uri: string): Promise<{ publishedUri?: string; warning?: string }> {
  const file = new File(uri);
  try {
    const publishedUri = Platform.OS === "android"
      ? await publishAndroid(file, `${safeFileName(docName)}-${id}.pdf`, "Download")
      : Platform.OS === "ios"
        ? await publishIos(file, `${safeFileName(docName)}.pdf`)
        : undefined;
    return { publishedUri };
  } catch (error) {
    console.warn("PDF is saved in Lens, but could not be copied to shared storage:", error);
    const destination = Platform.OS === "android" ? "Downloads/Lens" : "Files";
    return { warning: `Saved in Lens, but couldn't copy the PDF to ${destination}.` };
  }
}

export async function generateImages(
  id: string,
  docName: string,
  pages?: string[],
  expectedPageCount?: number,
  onProgress?: ExportProgressCallback,
  alreadyPublished: Array<string | null> = [],
): Promise<GeneratedImages> {
  const uris = await persistSourcePages(id, pages, expectedPageCount);
  const publishedUris: Array<string | null> = Array(uris.length).fill(null);
  let warning: string | undefined;
  for (let index = 0; index < uris.length; index += 1) {
    const file = new File(uris[index]);
    if (alreadyPublished[index]) {
      publishedUris[index] = alreadyPublished[index];
      onProgress?.(index + 1, uris.length);
      continue;
    }
    if (Platform.OS === "android" || Platform.OS === "ios") {
      try {
        const baseName = `${safeFileName(docName)}-page-${String(index + 1).padStart(3, "0")}`;
        const displayName = `${Platform.OS === "android" ? `${baseName}-${id}` : baseName}${file.extension || ".jpg"}`;
        publishedUris[index] = Platform.OS === "android"
          ? await publishAndroid(file, displayName, "Image")
          : await publishIos(file, displayName);
      } catch (error) {
        const destination = Platform.OS === "android" ? "Pictures/Lens" : "Files";
        warning = `Saved in Lens, but couldn't copy all images to ${destination}.`;
        console.warn(`Could not publish image ${index + 1}:`, error);
      }
    }
    onProgress?.(index + 1, uris.length);
  }
  return { uris, publishedUris, warning };
}

export async function shareImage(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable on this device.");
  await Sharing.shareAsync(uri, { mimeType: "image/jpeg", UTI: "public.jpeg" });
}

export function deleteDocumentFiles(id: string): void {
  const sourceDir = sourceDirFor(id);
  if (sourceDir.exists) sourceDir.delete();
  const pdfFile = new File(privateScansDir(), `${id}.pdf`);
  if (pdfFile.exists) pdfFile.delete();
  if (Platform.OS === "ios") {
    const legacySource = new Directory(legacyScansDir(), id);
    const legacyPdf = new File(legacyScansDir(), `${id}.pdf`);
    if (legacySource.exists) legacySource.delete();
    if (legacyPdf.exists) legacyPdf.delete();
  }
}

export function cleanupOrphanedScans(knownIds: Set<string>, activeIds: Set<string> = new Set()): void {
  const directories = Platform.OS === "ios" ? [privateScansDir(), legacyScansDir()] : [privateScansDir()];
  for (const directory of directories) {
    if (!directory.exists) continue;
    for (const entry of directory.list()) {
      if (entry instanceof Directory && !knownIds.has(entry.name) && !activeIds.has(entry.name)) entry.delete();
      if (entry instanceof File && entry.extension.toLowerCase() === ".pdf" && !knownIds.has(entry.name.replace(/\.pdf$/i, ""))) entry.delete();
    }
  }
}

/** Remove old iOS internals after the migrated index has been persisted. */
export function cleanupLegacyIosDocuments(documents: Array<{
  id: string; pageCount: number; sourceUris?: string[]; pdfUri?: string;
}>): void {
  if (Platform.OS !== "ios") return;
  const legacyRoot = legacyScansDir();
  const exportsDir = new Directory(Paths.document, "Lens");
  for (const document of documents) {
    const legacySource = new Directory(legacyRoot, document.id, "source");
    const newSource = sourceDirFor(document.id);
    const newSourcePrefix = `${newSource.uri.replace(/\/?$/, "/")}`;
    if (legacySource.exists && newSource.exists &&
      document.sourceUris?.length === document.pageCount &&
      document.sourceUris.every((uri) => uri.startsWith(newSourcePrefix))) {
      const newPageCount = newSource.list().filter((entry) => entry instanceof File).length;
      if (newPageCount === document.pageCount) {
        try { legacySource.delete(); }
        catch (error) { console.warn("Could not remove migrated legacy pages:", error); }
      }
    }

    const legacyPdf = new File(legacyRoot, `${document.id}.pdf`);
    if (legacyPdf.exists && document.pdfUri?.startsWith(`${exportsDir.uri.replace(/\/?$/, "/")}`) && new File(document.pdfUri).exists) {
      try { legacyPdf.delete(); }
      catch (error) { console.warn("Could not remove migrated legacy PDF:", error); }
    }

    const staging = new Directory(privateScansDir(), document.id, ".migration");
    if (staging.exists) {
      try { staging.delete(); }
      catch (error) { console.warn("Could not remove migration staging files:", error); }
    }

    const legacyDocumentDir = new Directory(legacyRoot, document.id);
    if (legacyDocumentDir.exists && legacyDocumentDir.list().length === 0) {
      try { legacyDocumentDir.delete(); }
      catch (error) { console.warn("Could not remove empty legacy document directory:", error); }
    }
  }
  if (legacyRoot.exists && legacyRoot.list().length === 0) {
    try { legacyRoot.delete(); }
    catch (error) { console.warn("Could not remove empty legacy scan directory:", error); }
  }
}

/** Copy existing iOS documents out of the Files-visible legacy scans folder. */
export async function migrateLegacyIosDocuments<T extends {
  id: string; name: string; pageCount: number; thumbUri: string;
  sourceUris?: string[]; imageUris?: string[]; pdfUri?: string;
}>(documents: T[]): Promise<T[]> {
  if (Platform.OS !== "ios") return documents;
  let changed = false;
  const migrated: T[] = [];
  const legacyRoot = legacyScansDir();
  const exportsDir = new Directory(Paths.document, "Lens");

  for (const document of documents) {
    const legacySource = new Directory(legacyRoot, document.id, "source");
    const legacyPdf = new File(legacyRoot, `${document.id}.pdf`);
    if (!legacySource.exists && !legacyPdf.exists) {
      migrated.push(document);
      continue;
    }

    let next = { ...document };
    if (legacySource.exists) {
      const oldPages = legacySource.list().filter((entry): entry is File => entry instanceof File)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      if (oldPages.length === document.pageCount) {
        const newSource = sourceDirFor(document.id);
        if (newSource.exists) {
          const newPages = newSource.list().filter((entry): entry is File => entry instanceof File)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          const complete = newPages.length === oldPages.length &&
            newPages.every((page, index) => page.size !== null && page.size === oldPages[index].size);
          if (!complete) newSource.delete();
        }
        const sourceUris = await persistSourcePages(document.id, oldPages.map((file) => file.uri), document.pageCount);
        next = { ...next, sourceUris, thumbUri: sourceUris[0] };
        const exportPrefix = `${exportsDir.uri.replace(/\/?$/, "/")}`;
        if (document.imageUris && !document.imageUris.every((uri) => uri.startsWith(exportPrefix))) {
          exportsDir.create({ intermediates: true, idempotent: true });
          const imageUris: string[] = [];
          for (let index = 0; index < sourceUris.length; index += 1) {
            const source = new File(sourceUris[index]);
            const filename = `${safeFileName(document.name)}-${document.id}-page-${String(index + 1).padStart(3, "0")}${source.extension || ".jpg"}`;
            const target = new File(exportsDir, filename);
            if (!target.exists || source.size === null || target.size !== source.size) {
              await copyMigrationFile(source, target, document.id);
            }
            imageUris.push(target.uri);
          }
          next.imageUris = imageUris;
        }
      }
    }

    if (legacyPdf.exists) {
      exportsDir.create({ intermediates: true, idempotent: true });
      const target = new File(exportsDir, `${safeFileName(document.name)}-${document.id}.pdf`);
      if (!target.exists || legacyPdf.size === null || target.size !== legacyPdf.size) {
        await copyMigrationFile(legacyPdf, target, document.id);
      }
      next.pdfUri = target.uri;
    }
    if (JSON.stringify(next) !== JSON.stringify(document)) changed = true;
    migrated.push(next);
  }
  return changed ? migrated : documents;
}
