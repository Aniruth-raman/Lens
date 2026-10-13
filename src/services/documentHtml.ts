// Pure string-building only — no filesystem or platform APIs, so this is
// trivially testable in isolation from expo-print/expo-file-system.
const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function buildDocumentHtml(
  imageDataUris: string[],
  docName: string,
): string {
  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (character) => htmlEntities[character]);
  const safeName = escapeHtml(docName);
  const pages = imageDataUris
    .map(
      (uri) => `
      <div class="page">
        <img src="${escapeHtml(uri)}" alt="${safeName}" />
      </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeName}</title>
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
