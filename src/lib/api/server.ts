import "server-only";

import type { PageResponse } from "@/lib/api/contracts";
import { mockApiGet } from "@/mocks/backend-adapter";

export class ServerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: unknown,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

export async function serverApiGet<T>(path: string): Promise<T> {
  const response = mockApiGet(path);
  if (response.status >= 400) {
    throw new ServerApiError(
      response.status,
      response.message ?? "Mock request failed",
      response.data,
    );
  }
  return response.data as T;
}

export async function serverApiGetOrNull<T>(path: string) {
  try {
    return await serverApiGet<T>(path);
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) return null;
    throw error;
  }
}

export async function serverApiPage<T>(path: string) {
  return serverApiGet<PageResponse<T>>(path);
}

export async function serverApiAll<T>(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  const first = await serverApiPage<T>(`${path}${separator}page=0&size=100`);
  if (first.totalPages <= 1) return first.content;

  const remaining = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) =>
      serverApiPage<T>(
        `${path}${separator}page=${index + 1}&size=100`,
      ),
    ),
  );
  return [first, ...remaining].flatMap((page) => page.content);
}
