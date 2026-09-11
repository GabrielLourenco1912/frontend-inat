import { apiRequest } from "@/lib/api/client";
import type { PageResponse } from "@/lib/api/contracts";

export async function apiCatalog<T>(path: string): Promise<T[]> {
  const separator = path.includes("?") ? "&" : "?";
  const first = await apiRequest<PageResponse<T>>(`${path}${separator}page=0&size=100`);
  const items = [...first.content];
  // Keep concurrency bounded; this is only needed when opening an editor/history.
  for (let page = 1; page < first.totalPages; page++) {
    const result = await apiRequest<PageResponse<T>>(`${path}${separator}page=${page}&size=100`);
    items.push(...result.content);
  }
  return items;
}
