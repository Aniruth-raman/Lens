export type ScannedDoc = {
  id: string;
  name: string;
  pdfUri: string;
  thumbUri: string; // first page image
  pageCount: number;
  createdAt: number; // timestamp
};

export type RootStackParamList = {
  Gallery: undefined;
  Review: { images: string[] };
  PdfPreview: { pdfUri: string; docName: string };
};
