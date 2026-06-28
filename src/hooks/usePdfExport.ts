import { useCallback, useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, Directory, File } from 'expo-file-system';

function safeName(value: string): string {
  return value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'scan';
}

function mimeTypeFor(file: File): string {
  const extension = (file.extension || '').toLowerCase().replace(/^\./, '');
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic') return 'image/heic';
  return 'image/jpeg';
}

async function toDataUri(uri: string): Promise<string> {
  const file = new File(uri);
  return `data:${mimeTypeFor(file)};base64,${await file.base64()}`;
}

function buildHtml(imageUris: string[], docName: string): string {
  const pages = imageUris
    .map(
      (uri) => `
      <div class="page">
        <img src="${uri}" alt="${docName}" />
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
      @page { margin: 0; }
      html, body { width: 100%; height: 100%; background: #fff; }
      body { background: #fff; }
      .page {
        width: 100%;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        page-break-after: always;
        overflow: hidden;
      }
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
      }
      .page:last-child { page-break-after: auto; }
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
        const html = buildHtml(await Promise.all(imageUris.map(toDataUri)), docName);
        const { uri: tmpUri } = await Print.printToFileAsync({ html });

        const scansDir = new Directory(Paths.document, 'scans');
        scansDir.create({ intermediates: true, idempotent: true });

        const fileName = `${safeName(docName)}_${Date.now()}.pdf`;
        const destFile = new File(scansDir, fileName);
        await new File(tmpUri).move(destFile);

        return destFile.uri;
      } finally {
        setExporting(false);
      }
    },
    []
  );

  const exportAsImages = useCallback(
    async (imageUris: string[], docName: string): Promise<string[]> => {
      setExporting(true);
      try {
        const scansDir = new Directory(Paths.document, 'scans');
        scansDir.create({ intermediates: true, idempotent: true });

        const docDir = new Directory(scansDir, `${safeName(docName)}_${Date.now()}`);
        docDir.create({ intermediates: true, idempotent: true });

        return await Promise.all(
          imageUris.map(async (uri, index) => {
            const source = new File(uri);
            const ext = (source.extension || '.jpg').replace(/^\./, '') || 'jpg';
            const destFile = new File(docDir, `page-${index + 1}.${ext}`);

            try {
              await source.copy(destFile);
            } catch {
              destFile.write(await source.bytes());
            }

            return destFile.uri;
          })
        );
      } finally {
        setExporting(false);
      }
    },
    []
  );

  const shareFile = useCallback(async (uri: string, mimeType: string) => {
    const available = await Sharing.isAvailableAsync();
    if (!available) throw new Error('Sharing is not available on this device');
    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: 'Share file',
      UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
    });
  }, []);

  return { exportToPdf, exportAsImages, shareFile, exporting };
}
