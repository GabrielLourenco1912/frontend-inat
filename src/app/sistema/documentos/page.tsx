import { redirect } from "next/navigation";
import { ExpiredDocumentList } from "@/components/portal/ExpiredDocumentList";
import type { DocumentType, Learner, Person, PersonDocument } from "@/lib/api/domain-contracts";
import { serverApiGetOrNull, serverApiPage } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";
import { expiredDocumentsPage } from "@/lib/documents/navigation";

export default async function DocumentsPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  await requireCapability("documents:read");
  const pageNumber = expiredDocumentsPage((await searchParams).page);
  const page = await serverApiPage<PersonDocument>(
    `/api/person-documents?verificationStatus=EXPIRED&page=${pageNumber}&size=20`,
  );
  if (pageNumber > 0 && pageNumber >= page.totalPages) {
    redirect(`/sistema/documentos?page=${Math.max(1, page.totalPages)}`);
  }
  const [owners, types] = await Promise.all([
    Promise.all([...new Set(page.content.map((document) => document.personId))].map(async (personId) => {
      const [person, learners] = await Promise.all([
        serverApiGetOrNull<Person>(`/api/people/${encodeURIComponent(personId)}`),
        serverApiPage<Learner>(`/api/learners?personId=${encodeURIComponent(personId)}&page=0&size=1`),
      ]);
      return { personId, name: person?.fullName ?? "Pessoa indisponível", learnerId: learners.content[0]?.id };
    })),
    Promise.all([...new Set(page.content.map((document) => document.documentTypeId))].map((id) =>
      serverApiGetOrNull<DocumentType>(`/api/document-types/${id}`),
    )),
  ]);
  return <ExpiredDocumentList page={page} owners={owners} documentTypes={types.filter((type): type is DocumentType => type !== null)} />;
}
