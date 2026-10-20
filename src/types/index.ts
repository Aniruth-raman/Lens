export type ScannedDoc = {
  id: string;
  name: string;
  thumbUri: string;
  pageCount: number;
  createdAt: number;
  updatedAt?: number;
  /** Durable app-private originals used for thumbnails and future exports. */
  sourceUris?: string[];
  pdfUri?: string;
  imageUris?: string[];
  publishedUris?: { pdf?: string; images?: Array<string | null> };
};

export type ExportProgress = { documentId: string; done: number; total: number };

export type ExportMode = "pdf" | "images";

export type RootStackParamList = {
  Gallery: undefined;
  Review: { images: string[] };
  // Deliberately just an id — screens load full document data from the
  // shared store rather than carrying a payload through navigation.
  PdfPreview: { id: string };
};
