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
  PdfPreview: {
    id: string;
    docName: string;
    thumbUri: string;
    pageCount: number;
    pdfUri?: string;
    imageUris?: string[];
  };
};
