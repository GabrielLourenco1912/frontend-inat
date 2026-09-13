import type { PageResponse } from "@/lib/api/contracts";

export const PAGE_SIZE = 20;
export type ListQuery = Record<string, string | string[] | undefined>;
export type ListPageProps = { searchParams?: Promise<ListQuery> };
export type Pagination = {
  search?: string;
  total: number;
  page: number;
  totalPages: number;
  previousHref?: string;
  nextHref?: string;
};

export function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// URLs are one-based; the API is zero-based. Reject malformed/unsafe integers.
export function pageIndex(value: string | string[] | undefined) {
  const raw = queryValue(value);
  if (!raw || !/^[1-9]\d*$/.test(raw)) return 0;
  const number = Number(raw);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number - 1 : 0;
}

export function pageHref(query: ListQuery, page: number, key = "page") {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && name !== key) {
      for (const item of Array.isArray(value) ? value : [value]) params.append(name, item);
    }
  }
  params.set(key, String(page + 1));
  return `?${params.toString()}`;
}

export function paginationProps(page: Omit<PageResponse<unknown>, "content">, query: ListQuery = {}, key = "page"): Pagination {
  return {
    search: queryValue(query.q)?.trim() ?? "",
    total: page.totalElements,
    page: page.page,
    totalPages: page.totalPages,
    previousHref: !page.first ? pageHref(query, page.page - 1, key) : undefined,
    nextHref: !page.last ? pageHref(query, page.page + 1, key) : undefined,
  };
}

// Used only for endpoints that return arrays instead of PageResponse.
export function paginateItems<T>(items: T[], requestedPage = 0): PageResponse<T> {
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const page = Math.max(0, Math.min(requestedPage, Math.max(0, totalPages - 1)));
  return {
    content: items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    page, size: PAGE_SIZE, totalElements: items.length, totalPages,
    first: page === 0, last: page >= totalPages - 1,
  };
}
