const ILLEGAL_FILE_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;
const MAX_NAME_BYTES = 180;

function truncateUtf8(value: string, maxBytes: number): string {
  let result = "";
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    const nextBytes = point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    if (bytes + nextBytes > maxBytes) break;
    result += character;
    bytes += nextBytes;
  }
  return result;
}

export function safeFileName(name: string): string {
  const cleaned = name
    .normalize("NFC")
    .replace(ILLEGAL_FILE_CHARACTERS, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
  return truncateUtf8(cleaned, MAX_NAME_BYTES) || "Scan";
}

export function uniqueFileName(name: string, existingNames: Iterable<string>): string {
  const safeName = safeFileName(name);
  const existing = new Set([...existingNames].map((value) => value.toLowerCase()));
  if (!existing.has(safeName.toLowerCase())) return safeName;

  for (let counter = 2; ; counter += 1) {
    const suffix = ` (${counter})`;
    const candidate = `${truncateUtf8(safeName, MAX_NAME_BYTES - suffix.length)}${suffix}`;
    if (!existing.has(candidate.toLowerCase())) return candidate;
  }
}

export function defaultDocumentName(date = new Date()): string {
  const two = (value: number) => String(value).padStart(2, "0");
  return `Scan ${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}-${two(date.getMinutes())}-${two(date.getSeconds())}-${String(date.getMilliseconds()).padStart(3, "0")}`;
}
