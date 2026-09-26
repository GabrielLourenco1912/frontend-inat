import "server-only";
import { serverApiPage } from "@/lib/api/server";
import { listRequestPath } from "@/lib/api/list-query";
import type { ListQuery } from "@/lib/pagination";

export async function serverListPage<T>(path: string, query: ListQuery = {}, key = "page") {
  const requestPath = listRequestPath(path, query, key);
  const result = await serverApiPage<T>(requestPath);
  // Deletions and old bookmarks can leave a page beyond the last one.
  if (result.page > 0 && result.page >= result.totalPages) {
    const [pathname, search] = requestPath.split("?");
    const params = new URLSearchParams(search);
    params.set("page", String(Math.max(0, result.totalPages - 1)));
    return serverApiPage<T>(`${pathname}?${params}`);
  }
  return result;
}
