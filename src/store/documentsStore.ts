import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScannedDoc, ExportMode } from "../types";
import {
  deleteDocumentFiles,
  generatePdf,
  generateImages,
  persistSourcePages,
} from "../services/documentExportService";

const STORAGE_KEY = "lens_docs";

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

export const useDocumentsStore = create<DocumentsState>((set, get) => {
  let indexWriteQueue: Promise<void> = Promise.resolve();
  let activeExports = 0;

  const updateIndex = (update: (docs: ScannedDoc[]) => ScannedDoc[]) => {
    const write = indexWriteQueue.then(async () => {
      const docs = update(get().docs);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
      set({ docs });
    });
    indexWriteQueue = write.catch(() => undefined);
    return write;
  };

  const trackExport = async <T>(operation: () => Promise<T>) => {
    activeExports += 1;
    set({ exporting: true });
    try {
      return await operation();
    } finally {
      activeExports -= 1;
      set({ exporting: activeExports > 0 });
    }
  };

  const reExport = async (id: string, mode: ExportMode) => {
    const target = get().docs.find((doc) => doc.id === id);
    if (!target) throw new Error("Document not found.");

    return trackExport(async () => {
      const result =
        mode === "pdf"
          ? {
              pdfUri: await generatePdf(
                id,
                target.name,
                target.sourceUris,
                target.pageCount,
              ),
            }
          : {
              imageUris: await generateImages(
                id,
                target.name,
                target.sourceUris,
                target.pageCount,
              ),
            };

      await updateIndex((docs) =>
        docs.map((doc) =>
          doc.id === id ? { ...doc, ...result, updatedAt: Date.now() } : doc,
        ),
      );
    });
  };

  return {
    docs: [],
    loading: true,
    exporting: false,

    load: async () => {
      set({ loading: true });
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        set({ docs: Array.isArray(parsed) ? parsed.filter(isScannedDoc) : [] });
      } catch (e) {
        console.error("Failed to load documents:", e);
        set({ docs: [] });
      } finally {
        set({ loading: false });
      }
    },

    createDocument: async ({ name, imageUris, exportMode }) => {
      const normalizedName = name.trim();
      if (!normalizedName) throw new Error("A document name is required.");
      if (
        !Array.isArray(imageUris) ||
        imageUris.length === 0 ||
        imageUris.some((uri) => typeof uri !== "string" || !uri.trim())
      ) {
        throw new Error("Cannot create a document with no pages.");
      }

      const now = Date.now();
      const id = `${now}-${Math.random().toString(36).slice(2, 10)}`;

      if (exportMode !== "pdf" && exportMode !== "images") {
        throw new Error("Choose PDF or image export.");
      }

      return trackExport(async () => {
        try {
          const sourceUris = await persistSourcePages(id, imageUris);
          const doc: ScannedDoc = {
            id,
            name: normalizedName,
            thumbUri: sourceUris[0],
            sourceUris,
            pageCount: sourceUris.length,
            createdAt: now,
            updatedAt: now,
          };

          if (exportMode === "pdf") {
            doc.pdfUri = await generatePdf(id, normalizedName, sourceUris);
          } else {
            doc.imageUris = await generateImages(
              id,
              normalizedName,
              sourceUris,
            );
          }

          await updateIndex((docs) => [doc, ...docs]);
          return doc;
        } catch (error) {
          try {
            deleteDocumentFiles(id);
          } catch (cleanupError) {
            console.error(
              "Failed to clean up an incomplete document:",
              cleanupError,
            );
          }
          throw error;
        }
      });
    },

    reExportPdf: (id) => reExport(id, "pdf"),

    reExportImages: (id) => reExport(id, "images"),

    deleteDoc: async (id) => {
      await updateIndex((docs) => docs.filter((d) => d.id !== id));
      try {
        deleteDocumentFiles(id);
      } catch (error) {
        // The record is already removed. A cleanup failure should not make the
        // caller report that deletion failed when the document is gone.
        console.error(
          "Document was removed but its files could not be cleaned up:",
          error,
        );
      }
    },

    renameDoc: async (id, name) => {
      const normalizedName = name.trim();
      if (!normalizedName) throw new Error("A document name is required.");
      await updateIndex((docs) =>
        docs.map((d) =>
          d.id === id
            ? { ...d, name: normalizedName, updatedAt: Date.now() }
            : d,
        ),
      );
    },
  };
});

function isScannedDoc(value: unknown): value is ScannedDoc {
  if (!value || typeof value !== "object") return false;
  const doc = value as Partial<ScannedDoc>;
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
    (doc.pdfUri === undefined || typeof doc.pdfUri === "string")
  );
}
