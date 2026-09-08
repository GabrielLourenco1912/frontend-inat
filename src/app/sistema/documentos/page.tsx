import { DocumentQueue } from "@/components/portal/DocumentQueue";
import type { DocumentType, Person, PersonDocument } from "@/lib/api/domain-contracts";
import { serverApiAll } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";

export default async function DocumentsPage() {
  await requireCapability("documents:read");
  const [documents, documentTypes, people] = await Promise.all([
    serverApiAll<PersonDocument>("/api/person-documents"),
    serverApiAll<DocumentType>("/api/document-types"),
    serverApiAll<Person>("/api/people"),
  ]);
  return <DocumentQueue documents={documents} documentTypes={documentTypes} people={people} />;
}
