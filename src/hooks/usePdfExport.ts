import { useCallback, useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, Directory, File } from 'expo-file-system';

function buildHtml(imageUris: string[], docName: string): string {
  const pages = imageUris
    .map(
      (uri) => `
      <div class="page">
        <img src="${uri}" />
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${docName}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #fff; }
      .page {
        width: 100%;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        page-break-after: always;
      }
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    </style>
  </head>
  <body>${pages}</body>
</html>`;
}

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);

  const exportToPdf = useCallback(
    async (imageUris: string[], docName: string): Promise<string> => {
      setExporting(true);
      try {
        const html = buildHtml(imageUris, docName);
        const { uri: tmpUri } = await Print.printToFileAsync({ html, base64: false });

        // Create scans subdirectory in documents
        const scansDir = new Directory(Paths.document, 'scans');
        scansDir.create();

        const fileName = `${docName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const destFile = new File(scansDir, fileName);

        // Move the printed file to our permanent location
        const tmpFile = new File(tmpUri);
        tmpFile.move(destFile);

        return destFile.uri;
      } finally {
        setExporting(false);
      }
    },
    []
  );

  const sharePdf = useCallback(async (pdfUri: string) => {
    const available = await Sharing.isAvailableAsync();
    if (!available) throw new Error('Sharing is not available on this device');
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share PDF',
      UTI: 'com.adobe.pdf',
    });
  }, []);

  return { exportToPdf, sharePdf, exporting };
}
