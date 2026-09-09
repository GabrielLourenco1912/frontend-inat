export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

export const DOCUMENT_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp"] as const;

export const GENERAL_ATTACHMENT_EXTENSIONS = [
  ...DOCUMENT_EXTENSIONS,
  "gif",
  "txt",
  "csv",
  "rtf",
  "docx",
  "xlsx",
  "pptx",
  "odt",
  "ods",
  "odp",
  "mp3",
  "mp4",
  "webm",
  "wav",
] as const;

export const DOCUMENT_FILE_ACCEPT = DOCUMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

export const GENERAL_ATTACHMENT_ACCEPT = GENERAL_ATTACHMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

export function uploadValidationError(
  file: File,
  allowedExtensions: readonly string[],
) {
  if (!file.size) return "O arquivo está vazio.";
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return "O arquivo deve ter no máximo 25 MB.";
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return `Formato não permitido. Use: ${allowedExtensions.join(", ")}.`;
  }
  return null;
}
