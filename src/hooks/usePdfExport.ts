import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { Paths, Directory, File } from 'expo-file-system';
import ReactNativeBlobUtil from 'react-native-blob-util';

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

async function persistScanPages(imageUris: string[], id: string): Promise<string[]> {
  const scansDir = new Directory(Paths.document, "scans");
  scansDir.create({ intermediates: true, idempotent: true });

  const docDir = new Directory(scansDir, id);
  if (docDir.exists) docDir.delete();
  docDir.create({ intermediates: true, idempotent: true });

  return await Promise.all(
    imageUris.map(async (uri, index) => {
      const source = new File(uri);
      const ext = (source.extension || ".jpg").replace(/^\./, "") || "jpg";
      const destFile = new File(docDir, `page-${index + 1}.${ext}`);
      await source.copy(destFile);
      return destFile.uri;
    })
  );
}

function toLocalPath(uri: string): string {
  return uri.startsWith('file://') ? uri.replace(/^file:\/\//, '') : uri;
}

function safeFileName(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'scan';
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

type PdfExportHook = {
  exportToPdf: (imageUris: string[], docName: string, id: string) => Promise<string>;
  exportAsImages: (imageUris: string[], docName: string, id: string) => Promise<string[]>;
  saveScanPages: (imageUris: string[], id: string) => Promise<string[]>;
  exporting: boolean;
};

export function usePdfExport(): PdfExportHook {
  const [exporting, setExporting] = useState(false);

  const saveScanPages = useCallback(async (imageUris: string[], id: string) => {
    return await persistScanPages(imageUris, id);
  }, []);

  const exportToPdf = useCallback(
    async (imageUris: string[], docName: string, id: string): Promise<string> => {
      setExporting(true);
      try {
        const html = buildHtml(await Promise.all(imageUris.map(toDataUri)), docName);
        const { uri: tmpUri } = await Print.printToFileAsync({ html });

        if (Platform.OS === 'android') {
          return ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
            {
              name: `${safeFileName(docName)}-${id}.pdf`,
              parentFolder: 'Lens/scans',
              mimeType: 'application/pdf',
            },
            'Download',
            toLocalPath(tmpUri),
          );
        }

        const scansDir = new Directory(Paths.document, 'scans');
        scansDir.create({ intermediates: true, idempotent: true });

        const destFile = new File(scansDir, `${id}.pdf`);
        // overwrite if this id was already exported before (re-save)
        if (destFile.exists) destFile.delete();
        await new File(tmpUri).move(destFile);

        return destFile.uri;
      } finally {
        setExporting(false);
      }
    },
    []
  );

  const exportAsImages = useCallback(
    async (imageUris: string[], docName: string, id: string): Promise<string[]> => {
      setExporting(true);
      try {
        if (Platform.OS === 'android') {
          return await Promise.all(
            imageUris.map(async (uri, index) => {
              const source = new File(uri);
              const ext = (source.extension || '.jpg').replace(/^\./, '') || 'jpg';

              return ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
                {
                  name: `${safeFileName(docName)}-${id}-page-${index + 1}.${ext}`,
                  parentFolder: `Lens/scans/${id}`,
                  mimeType: mimeTypeFor(source),
                },
                'Image',
                toLocalPath(uri),
              );
            })
          );
        }

        const scansDir = new Directory(Paths.document, 'scans');
        scansDir.create({ intermediates: true, idempotent: true });

        const docDir = new Directory(scansDir, id);
        const docDirUri = docDir.uri.endsWith('/') ? docDir.uri : `${docDir.uri}/`;

        // If the images already live in the target folder, reusing them avoids
        // deleting the source before we have a chance to copy it.
        if (imageUris.length > 0 && imageUris.every((uri) => uri.startsWith(docDirUri))) {
          return imageUris;
        }

        // clear out a stale prior export for this id before writing fresh pages
        if (docDir.exists) docDir.delete();
        docDir.create({ intermediates: true, idempotent: true });

        return await Promise.all(
          imageUris.map(async (uri, index) => {
            const source = new File(uri);
            const ext = (source.extension || '.jpg').replace(/^\./, '') || 'jpg';
            const destFile = new File(docDir, `page-${index + 1}.${ext}`);

            try {
              await source.copy(destFile);
            } catch {
              if (source.exists) {
                destFile.write(await source.bytes());
              }
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

  return { exportToPdf, exportAsImages, saveScanPages, exporting };
}