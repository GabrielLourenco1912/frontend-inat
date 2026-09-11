"use client";

import { useState, Children, type ReactNode } from "react";
import { ListPagination } from "@/components/design-system/ListPagination";
import { paginateItems, PAGE_SIZE } from "@/lib/pagination";

export function useClientPagination<T>(items: T[], resetKey = "", initialIndex = 0) {
  const [state, setState] = useState({ key: resetKey, page: Math.floor(Math.max(0, initialIndex) / PAGE_SIZE) });
  const requested = state.key === resetKey ? state.page : Math.floor(Math.max(0, initialIndex) / PAGE_SIZE);
  const result = paginateItems(items, requested);
  if (state.key !== resetKey || state.page !== result.page) setState({ key: resetKey, page: result.page });
  return {
    items: result.content,
    controls: <ListPagination shown={result.content.length} total={result.totalElements} page={result.page} totalPages={result.totalPages}
      onPageChange={(page) => setState({ key: resetKey, page })} />,
  };
}

// For detail collections already supplied in full by the API.
export function PaginatedContent({ children, resetKey = "" }: { children: ReactNode; resetKey?: string }) {
  const page = useClientPagination(Children.toArray(children), resetKey);
  return <>{page.items}{page.controls}</>;
}
