// Pure string-building only — no filesystem or platform APIs, so this is
// trivially testable in isolation from expo-print/expo-file-system.
export function buildDocumentHtml(imageDataUris: string[], docName: string): string {
  const pages = imageDataUris
    .map(
      (uri) => `
      <div class="page">
        <img src="${uri}" alt="${docName}" />
      </div>`,
    )
    .join("");

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