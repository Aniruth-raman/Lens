import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ExportProgress, ExportMode, ScannedDoc } from "../types";
import {
  cleanupOrphanedScans,
  deleteDocumentFiles,
  generatePdf,
  generateImages,
  publishPdf,
  persistSourcePages,
  migrateLegacyIosDocuments,
} from "../services/documentExportService";
import { isScannedDoc } from "./validation";

const STORAGE_KEY = "lens_docs";
type SavedDoc = ScannedDoc & { exportWarning?: string };

type DocumentsState = {
  docs: ScannedDoc[];
  loading: boolean;
  exporting: boolean;
  exportProgress: ExportProgress | null;
  exportWarning: { documentId: string; message: string } | null;
  load: () => Promise<void>;
  createDocument: (args: { name: string; imageUris: string[]; exportMode: ExportMode }) => Promise<SavedDoc>;
  reExportPdf: (id: string) => Promise<void>;
  reExportImages: (id: string) => Promise<void>;
  deleteDoc: (id: string) => Promise<void>;
  renameDoc: (id: string, name: string) => Promise<void>;
};

export const useDocumentsStore = create<DocumentsState>((set, get) => {
  let indexWriteQueue: Promise<void> = Promise.resolve();
  let activeExports = 0;
  const activeIdCounts = new Map<string, number>();
  const activeIds = new Set<string>();

  const updateIndex = (update: (docs: ScannedDoc[]) => ScannedDoc[]) => {
    const write = indexWriteQueue.then(async () => {
      const docs = update(get().docs);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
      set({ docs });
    });
    indexWriteQueue = write.catch(() => undefined);
    return write;
  };

  const progressFor = (documentId: string) => (done: number, total: number) =>
    set({ exportProgress: { documentId, done, total } });

  const trackExport = async <T>(id: string, operation: () => Promise<T>) => {
    activeExports += 1;
    activeIdCounts.set(id, (activeIdCounts.get(id) ?? 0) + 1);
    activeIds.add(id);
    set({ exporting: true, exportProgress: { documentId: id, done: 0, total: 0 }, exportWarning: null });
    try {
      return await operation();
    } finally {
      activeExports -= 1;
      const remaining = (activeIdCounts.get(id) ?? 1) - 1;
      if (remaining === 0) {
        activeIdCounts.delete(id);
        activeIds.delete(id);
      } else activeIdCounts.set(id, remaining);
      set({ exporting: activeExports > 0, exportProgress: null });
    }
  };

  const reExport = async (id: string, mode: ExportMode) => {
    const target = get().docs.find((doc) => doc.id === id);
    if (!target) throw new Error("Document not found.");
    const pdfPublished = !target.publishedUris || !!target.publishedUris.pdf;
    const imagesPublished = !target.publishedUris ||
      (target.publishedUris.images?.length === target.pageCount && target.publishedUris.images.every(Boolean));
    if (mode === "pdf" && target.pdfUri && pdfPublished) return;
    if (mode === "images" && target.imageUris?.length === target.pageCount && imagesPublished) return;

    return trackExport(id, async () => {
      cleanupOrphanedScans(new Set(get().docs.map((doc) => doc.id)), activeIds);
      const pages = target.sourceUris ?? target.imageUris ?? (target.pageCount === 1 ? [target.thumbUri] : undefined);
      if (mode === "pdf") {
        const result = target.pdfUri
          ? await publishPdf(id, target.name, target.pdfUri)
          : await generatePdf(id, target.name, pages, target.pageCount, progressFor(id));
        if (result.warning) set({ exportWarning: { documentId: id, message: result.warning } });
        await updateIndex((docs) => docs.map((doc) => doc.id === id
          ? { ...doc, pdfUri: target.pdfUri ?? ("uri" in result && typeof result.uri === "string" ? result.uri : undefined), publishedUris: { ...doc.publishedUris, ...(result.publishedUri ? { pdf: result.publishedUri } : {}) }, updatedAt: Date.now() }
          : doc));
      } else {
        const result = await generateImages(id, target.name, pages, target.pageCount, progressFor(id), target.publishedUris?.images);
        if (result.warning) set({ exportWarning: { documentId: id, message: result.warning } });
        await updateIndex((docs) => docs.map((doc) => doc.id === id
          ? { ...doc, imageUris: result.uris, publishedUris: { ...doc.publishedUris, images: result.publishedUris }, updatedAt: Date.now() }
          : doc));
      }
    });
  };

  return {
    docs: [], loading: true, exporting: false, exportProgress: null, exportWarning: null,

    load: async () => {
      set({ loading: true });
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        const storedDocs = Array.isArray(parsed) ? parsed.filter(isScannedDoc) : [];
        const docs = await migrateLegacyIosDocuments(storedDocs);
        if (docs !== storedDocs) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
        set({ docs });
        cleanupOrphanedScans(new Set(docs.map((doc) => doc.id)), activeIds);
      } catch (error) {
        console.error("Failed to load documents:", error);
        set({ docs: [] });
      } finally {
        set({ loading: false });
      }
    },

    createDocument: async ({ name, imageUris, exportMode }) => {
      const normalizedName = name.trim();
      if (!normalizedName) throw new Error("A document name is required.");
      if (!Array.isArray(imageUris) || imageUris.length === 0 || imageUris.some((uri) => typeof uri !== "string" || !uri.trim())) {
        throw new Error("Cannot create a document with no pages.");
      }
      if (exportMode !== "pdf" && exportMode !== "images") throw new Error("Choose PDF or image export.");
      const now = Date.now();
      const id = `${now}-${Math.random().toString(36).slice(2, 10)}`;

      return trackExport(id, async () => {
        cleanupOrphanedScans(new Set(get().docs.map((doc) => doc.id)), activeIds);
        const sourceUris = await persistSourcePages(id, imageUris);
        const doc: ScannedDoc = {
          id, name: normalizedName, thumbUri: sourceUris[0], sourceUris,
          pageCount: sourceUris.length, createdAt: now, updatedAt: now, publishedUris: {},
        };
        // Persist the source index before derived export work. A PDF or public
        // copy failure must leave a recoverable document in Lens.
        await updateIndex((docs) => [doc, ...docs]);
        let warning: string | undefined;
        try {
          if (exportMode === "pdf") {
            const result = await generatePdf(id, normalizedName, sourceUris, sourceUris.length, progressFor(id));
            doc.pdfUri = result.uri;
            if (result.publishedUri) doc.publishedUris = { pdf: result.publishedUri };
            warning = result.warning;
          } else {
            const result = await generateImages(id, normalizedName, sourceUris, sourceUris.length, progressFor(id));
            doc.imageUris = result.uris;
            doc.publishedUris = { images: result.publishedUris };
            warning = result.warning;
          }
        } catch (error) {
          warning = "The scan is saved in Lens, but its export could not be created.";
          console.error("Scan saved, export failed:", error);
        }
        await updateIndex((docs) => docs.map((current) => current.id === id ? doc : current));
        return warning ? { ...doc, exportWarning: warning } : doc;
      });
    },

    reExportPdf: (id) => reExport(id, "pdf"),
    reExportImages: (id) => reExport(id, "images"),

    deleteDoc: async (id) => {
      await updateIndex((docs) => docs.filter((doc) => doc.id !== id));
      while (activeIds.has(id)) await new Promise((resolve) => setTimeout(resolve, 25));
      try { deleteDocumentFiles(id); }
      catch (error) { console.error("Document was removed but its files could not be cleaned up:", error); }
    },

    renameDoc: async (id, name) => {
      const normalizedName = name.trim();
      if (!normalizedName) throw new Error("A document name is required.");
      await updateIndex((docs) => docs.map((doc) => doc.id === id ? { ...doc, name: normalizedName, updatedAt: Date.now() } : doc));
    },
  };
});
