// Supported import types, resolved by extension because browsers often report "" for .md files.
export const MIME_BY_EXT = {
  pdf: "application/pdf", txt: "text/plain", md: "text/markdown", markdown: "text/markdown",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
};
export const ACCEPT_ATTR = Object.keys(MIME_BY_EXT).map((e) => `.${e}`).join(",");
export const MAX_BYTES = 10 * 1024 * 1024;

export const mimeFor = (file) => MIME_BY_EXT[file.name.split(".").pop()?.toLowerCase()] || null;

// SHA-256 of the file contents, used to detect re-importing the same file.
export async function hashFile(file) {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}