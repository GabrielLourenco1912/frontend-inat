export function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function expiredDocumentsPage(value: string | string[] | undefined) {
  const page = Number(firstQueryValue(value) ?? "1");
  return Number.isInteger(page) && page >= 1 && page <= 2_147_483_647 ? page - 1 : 0;
}

export function documentOwnerHref(personId: string, documentId: string, learnerId?: string) {
  const base = learnerId
    ? `/sistema/aprendizes/${encodeURIComponent(learnerId)}`
    : `/sistema/pessoas/${encodeURIComponent(personId)}`;
  return `${base}?${new URLSearchParams({ tab: "documentos", document: documentId })}`;
}
