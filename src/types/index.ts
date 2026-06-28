export type ScannedDoc = {
  id: string;
  name: string;
  pdfUri?: string;
  imageUris?: string[];
  thumbUri: string; // first page image
  pageCount: number;
  createdAt: number; // timestamp
};

export type RootStackParamList = {
  Gallery: undefined;
  Review: { images: string[] };
  PdfPreview: { docName: string; pdfUri?: string; imageUris?: string[] };
};
