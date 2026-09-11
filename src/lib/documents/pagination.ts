import "server-only";
import { serverListPage } from "@/lib/api/pagination";
import { serverApiGetOrNull } from "@/lib/api/server";
import type { PersonDocument, ContractDocument } from "@/lib/api/domain-contracts";
import { queryValue, type ListQuery } from "@/lib/pagination";

export async function personDocumentPage(personId: string, query: ListQuery) {
  const page = await serverListPage<PersonDocument>(`/api/person-documents?personId=${encodeURIComponent(personId)}`, query);
  const id = queryValue(query.document);
  const focused = id && !page.content.some((item) => item.id === id)
    ? await serverApiGetOrNull<PersonDocument>(`/api/person-documents/${encodeURIComponent(id)}`) : null;
  return { page, focusedDocument: focused?.personId === personId ? focused : undefined };
}

export async function contractDocumentPage(contractId: string, query: ListQuery) {
  const page = await serverListPage<ContractDocument>(`/api/contract-documents?contractId=${encodeURIComponent(contractId)}`, query);
  const id = queryValue(query.document);
  const focused = id && !page.content.some((item) => item.id === id)
    ? await serverApiGetOrNull<ContractDocument>(`/api/contract-documents/${encodeURIComponent(id)}`) : null;
  return { page, focusedDocument: focused?.contractId === contractId ? focused : undefined };
}
