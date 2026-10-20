import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from "react-native-document-scanner-plugin";

export type ScannerResult =
  | { status: "success"; images: string[] }
  | { status: "cancelled" };

export class ScannerServiceError extends Error {
  readonly originalError?: unknown;

  constructor(originalError?: unknown) {
    super("The document scanner could not be opened.");
    this.name = "ScannerServiceError";
    this.originalError = originalError;
  }
}

function normalizeFileUri(path: string): string {
  if (/^file:\/\//i.test(path)) return path;
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return path;
  const absolutePath = path.startsWith("/") ? path : `/${path}`;
  return `file://${absolutePath.split("/").map((segment, index) => index === 0 ? "" : encodeURIComponent(segment)).join("/")}`;
}

export async function scanDocument(): Promise<ScannerResult> {
  try {
    const result = await DocumentScanner.scanDocument({
      responseType: ResponseType.ImageFilePath,
    });
    if (result.status === ScanDocumentResponseStatus.Cancel) return { status: "cancelled" };
    if (result.status !== ScanDocumentResponseStatus.Success || !result.scannedImages?.length) {
      return { status: "cancelled" };
    }
    return {
      status: "success",
      images: result.scannedImages.map(normalizeFileUri),
    };
  } catch (error) {
    throw new ScannerServiceError(error);
  }
}
