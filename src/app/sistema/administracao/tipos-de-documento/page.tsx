import { DocumentTypeManager } from "@/components/portal/DocumentTypeManager";
import type { DocumentType } from "@/lib/api/domain-contracts";
import { serverListPage } from "@/lib/api/pagination";
import { paginationProps, type ListPageProps } from "@/lib/pagination";
import { requireCapability } from "@/lib/auth/session";

export default async function DocumentTypesPage({ searchParams }: ListPageProps) {
  await requireCapability("administration:read");
  const query = await searchParams ?? {};
  const page = await serverListPage<DocumentType>("/api/document-types", query);
  const documentTypes = page.content;
  return <DocumentTypeManager key={page.page} pagination={paginationProps(page, query)} documentTypes={documentTypes} />;
}
