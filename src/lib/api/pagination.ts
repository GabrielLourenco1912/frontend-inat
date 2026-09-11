import "server-only";
import { serverApiPage } from "@/lib/api/server";
import { PAGE_SIZE, pageIndex, type ListQuery } from "@/lib/pagination";

export async function serverListPage<T>(path: string, query: ListQuery = {}, key = "page") {
  const [pathname, search] = path.split("?");
  const params = new URLSearchParams(search);
  params.set("page", String(pageIndex(query[key])));
  params.set("size", String(PAGE_SIZE));
  const result = await serverApiPage<T>(`${pathname}?${params}`);
  // Deletions and old bookmarks can leave a page beyond the last one.
  if (result.page > 0 && result.page >= result.totalPages) {
    params.set("page", String(Math.max(0, result.totalPages - 1)));
    return serverApiPage<T>(`${pathname}?${params}`);
  }
  return result;
}
