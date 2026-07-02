export type ScannedDoc = {
  id: string;
  name: string;
  thumbUri: string;
  pageCount: number;
  createdAt: number;
  updatedAt?: number;
  pdfUri?: string;
  imageUris?: string[];
};

export type ExportMode = "pdf" | "images";

export type RootStackParamList = {
  Gallery: undefined;
  Review: { images: string[] };
  // Deliberately just an id — screens load full document data from the
  // shared store rather than carrying a payload through navigation.
  PdfPreview: { id: string };
};