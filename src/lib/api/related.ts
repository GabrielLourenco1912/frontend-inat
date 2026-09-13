import "server-only";
import { serverApiGetOrNull } from "@/lib/api/server";

export async function relatedRecords<T>(resource: string, ids: (string | null | undefined)[]): Promise<T[]> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const values = await Promise.all(unique.map((id) => serverApiGetOrNull<T>(`/api/${resource}/${encodeURIComponent(id)}`)));
  return values.filter((value): value is Awaited<T> => value !== null);
}
