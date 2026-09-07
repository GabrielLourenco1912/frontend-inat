import { DocumentTypeManager } from "@/components/portal/DocumentTypeManager";
import type { DocumentType } from "@/lib/api/domain-contracts";
import { serverApiAll } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";

export default async function DocumentTypesPage() {
  await requireCapability("administration:read");
  const documentTypes = await serverApiAll<DocumentType>("/api/document-types");
  return <DocumentTypeManager documentTypes={documentTypes} />;
}
