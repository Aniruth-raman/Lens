import type { ScannedDoc } from "../types";

export function isScannedDoc(value: unknown): value is ScannedDoc {
  if (!value || typeof value !== "object") return false;
  const doc = value as Partial<ScannedDoc>;
  const publishedUris = doc.publishedUris;
  const publishedUrisValid =
    publishedUris === undefined ||
    (typeof publishedUris === "object" &&
      publishedUris !== null &&
      (publishedUris.pdf === undefined || typeof publishedUris.pdf === "string") &&
      (publishedUris.images === undefined ||
        (Array.isArray(publishedUris.images) &&
          publishedUris.images.every((uri) => uri === null || typeof uri === "string"))));
  return (
    typeof doc.id === "string" &&
    typeof doc.name === "string" &&
    typeof doc.thumbUri === "string" &&
    typeof doc.pageCount === "number" &&
    Number.isFinite(doc.pageCount) &&
    doc.pageCount > 0 &&
    typeof doc.createdAt === "number" &&
    Number.isFinite(doc.createdAt) &&
    (doc.updatedAt === undefined ||
      (typeof doc.updatedAt === "number" && Number.isFinite(doc.updatedAt))) &&
    (doc.sourceUris === undefined ||
      (Array.isArray(doc.sourceUris) &&
        doc.sourceUris.length === doc.pageCount &&
        doc.sourceUris.every((uri) => typeof uri === "string" && !!uri))) &&
    (doc.imageUris === undefined ||
      (Array.isArray(doc.imageUris) &&
        doc.imageUris.every((uri) => typeof uri === "string" && !!uri))) &&
    (doc.pdfUri === undefined || typeof doc.pdfUri === "string") &&
    publishedUrisValid
  );
}
