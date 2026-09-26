import { PAGE_SIZE, pageIndex, queryValue, type ListQuery } from "@/lib/pagination";

export function listRequestPath(path: string, query: ListQuery = {}, key = "page") {
  const [originalPath, search] = path.split("?");
  let pathname = originalPath;
  const params = new URLSearchParams(search);
  const q = queryValue(query.q)?.trim();
  const status = queryValue(query.status)?.trim();
  if (pathname === "/api/contact-messages") {
    if (q) params.set("search", q);
    if (status) params.set("status", status);
  } else if ((q || status) && /^\/api\/(people|learners|organizations|contracts|cohorts|lessons|activities|notifications|users|roles|document-types)$/.test(pathname)) {
    pathname = pathname.replace("/api/", "/api/search/");
    if (q) params.set("q", q);
    if (status) params.set("status", status);
  }
  params.set("page", String(pageIndex(query[key])));
  params.set("size", String(PAGE_SIZE));
  return `${pathname}?${params}`;
}
