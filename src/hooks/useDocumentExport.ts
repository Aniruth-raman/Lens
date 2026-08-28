import { useCallback, useState } from "react";
import { generatePdf, generateImages } from "../services/documentExportService";

// Intentionally thin: all real logic lives in documentExportService.ts.
// This hook's only job is exposing an `exporting` boolean for screens that
// call export functions directly (the shared store has its own separate
// `exporting` flag for actions that go through it).
export function useDocumentExport() {
  const [exporting, setExporting] = useState(false);

  const exportToPdf = useCallback(
    async (id: string, docName: string, pages?: string[]) => {
      setExporting(true);
      try {
        return await generatePdf(id, docName, pages);
      } finally {
        setExporting(false);
      }
    },
    [],
  );

  const exportAsImages = useCallback(
    async (id: string, docName: string, pages?: string[]) => {
      setExporting(true);
      try {
        return await generateImages(id, docName, pages);
      } finally {
        setExporting(false);
      }
    },
    [],
  );

  return { exportToPdf, exportAsImages, exporting };
}