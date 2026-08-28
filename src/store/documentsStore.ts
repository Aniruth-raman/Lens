import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScannedDoc, ExportMode } from "../types";
import { generatePdf, generateImages } from "../services/documentExportService";

const STORAGE_KEY = "lens_docs";

// Date.now() alone can collide if two saves land in the same millisecond
// (unlikely but not impossible); this adds a random suffix as cheap
// insurance without pulling in a UUID dependency.
function generateDocumentId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}`;
}

async function persist(docs: ScannedDoc[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

type DocumentsState = {
  docs: ScannedDoc[];
  loading: boolean;
  exporting: boolean;

  load: () => Promise<void>;
  createDocument: (args: {
    name: string;
    imageUris: string[];
    exportMode: ExportMode;
  }) => Promise<ScannedDoc>;
  reExportPdf: (id: string) => Promise<void>;
  reExportImages: (id: string) => Promise<void>;
  deleteDoc: (id: string) => Promise<void>;
  renameDoc: (id: string, name: string) => Promise<void>;
};

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  docs: [],
  loading: true,
  exporting: false,

  load: async () => {
    set({ loading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ docs: [] });
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        set({ docs: Array.isArray(parsed) ? parsed : [] });
      } catch (e) {
        // Corrupted local data shouldn't crash the app — fall back to an
        // empty list rather than leaving `docs` stuck on stale state.
        console.error("Documents data is corrupted, resetting:", e);
        set({ docs: [] });
      }
    } catch (e) {
      console.error("Failed to read documents from storage:", e);
      set({ docs: [] });
    } finally {
      set({ loading: false });
    }
  },

  createDocument: async ({ name, imageUris, exportMode }) => {
    if (!imageUris || imageUris.length === 0) {
      throw new Error("Cannot create a document with no pages.");
    }

    const id = generateDocumentId();
    const now = Date.now();

    set({ exporting: true });
    try {
      const doc: ScannedDoc = {
        id,
        name,
        thumbUri: imageUris[0],
        pageCount: imageUris.length,
        createdAt: now,
        updatedAt: now,
      };

      if (exportMode === "pdf") {
        doc.pdfUri = await generatePdf(id, name, imageUris);
      } else {
        doc.imageUris = await generateImages(id, name, imageUris);
      }

      const updated = [doc, ...get().docs];
      set({ docs: updated });
      await persist(updated);
      return doc;
    } finally {
      set({ exporting: false });
    }
  },

  reExportPdf: async (id) => {
    const target = get().docs.find((d) => d.id === id);
    if (!target) throw new Error("Document not found.");

    set({ exporting: true });
    try {
      const pdfUri = await generatePdf(id, target.name);
      const updated = get().docs.map((d) =>
        d.id === id ? { ...d, pdfUri, updatedAt: Date.now() } : d,
      );
      set({ docs: updated });
      await persist(updated);
    } finally {
      set({ exporting: false });
    }
  },

  reExportImages: async (id) => {
    const target = get().docs.find((d) => d.id === id);
    if (!target) throw new Error("Document not found.");

    set({ exporting: true });
    try {
      const imageUris = await generateImages(id, target.name);
      const updated = get().docs.map((d) =>
        d.id === id ? { ...d, imageUris, updatedAt: Date.now() } : d,
      );
      set({ docs: updated });
      await persist(updated);
    } finally {
      set({ exporting: false });
    }
  },

  deleteDoc: async (id) => {
    // Only removes this doc from the app's own index. Files under
    // Paths.document are persistent user storage once saved — the app
    // doesn't delete them on the user's behalf.
    const updated = get().docs.filter((d) => d.id !== id);
    set({ docs: updated });
    await persist(updated);
  },

  renameDoc: async (id, name) => {
    const updated = get().docs.map((d) =>
      d.id === id ? { ...d, name, updatedAt: Date.now() } : d,
    );
    set({ docs: updated });
    await persist(updated);
  },
}));