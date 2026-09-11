import { downloadResource } from "@/lib/api/client";

export async function downloadDocument(path: string, fallbackName: string) {
  const result = await downloadResource(path);
  const encoded = result.contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  let name = result.contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallbackName;
  if (encoded) {
    try { name = decodeURIComponent(encoded); } catch { /* Use the original name for malformed headers. */ }
  }
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
