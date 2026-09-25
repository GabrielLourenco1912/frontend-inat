import { personDocumentPage } from "@/lib/documents/pagination";
import { paginationProps, type ListQuery } from "@/lib/pagination";
import { notFound } from "next/navigation";
import { DefinitionList, PageHeader, SectionHeading, Sheet } from "@/components/design-system/PortalPrimitives";
import { PersonActions } from "@/components/portal/ResourceCreators";
import { DetailTabs } from "@/components/portal/DetailTabs";
import { PersonDocumentManager } from "@/components/portal/PersonDocumentManager";
import type { DocumentType, Learner, Person } from "@/lib/api/domain-contracts";
import { formatDate, maskTaxId } from "@/lib/api/format";
import { serverApiAll, serverApiGetOrNull, serverApiPage } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";
import { personTypeLabels } from "@/lib/people/person-types";
import { firstQueryValue } from "@/lib/documents/navigation";

export default async function PersonDetailPage({ params, searchParams }: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<ListQuery>;
}) {
  const [, { personId }, query] = await Promise.all([requireCapability("people:read"), params, searchParams]);
  const person = await serverApiGetOrNull<Person>(`/api/people/${encodeURIComponent(personId)}`);
  if (!person) notFound();
  const learner = person.personTypes.includes("LEARNER")
    ? (await serverApiPage<Learner>(`/api/learners?personId=${encodeURIComponent(person.id)}&size=1`)).content[0] ?? null
    : null;
  const tab = firstQueryValue(query.tab) === "documentos" ? "documentos" : "dados";
  const [documentResult, documentTypes] = tab === "documentos" ? await Promise.all([
    personDocumentPage(person.id, query),
    serverApiAll<DocumentType>("/api/document-types"),
  ]) : [null, []];
  return <>
    <PageHeader eyebrow="Cadastro de pessoa" title={person.fullName} description={person.contactEmail || person.phoneNumber} backHref="/sistema/pessoas" backLabel="Voltar para pessoas" action={<PersonActions person={person} learner={learner} />} />
    <DetailTabs activeTab={tab} tabs={[{ id: "dados", label: "Dados pessoais" }, { id: "documentos", label: "Documentos" }]} label="Seções da pessoa" />
    {tab === "documentos" ? <PersonDocumentManager key={`${person.id}:${documentResult?.page.page}:${firstQueryValue(query.document) ?? ""}`} person={person} documents={documentResult?.page.content ?? []} focusedDocument={documentResult?.focusedDocument} pagination={documentResult ? paginationProps(documentResult.page, { ...query, document: undefined, tab: "documentos" }) : undefined} documentTypes={documentTypes} initialDocumentId={firstQueryValue(query.document)} /> : <div className="grid gap-5 xl:grid-cols-2">
      <Sheet><SectionHeading title="Identificação" icon="person" /><DefinitionList columns={2} items={[
        { label: "Nome", value: person.fullName },
        { label: "Tipos", value: personTypeLabels(person) },
        { label: "CPF", value: maskTaxId(person.taxId), mono: true },
        { label: "Nascimento", value: formatDate(person.birthDate) },
        { label: "Gênero", value: person.gender || "Não informado" },
        { label: "E-mail", value: person.contactEmail || "Não informado" },
        { label: "Telefone", value: person.phoneNumber },
      ]} /></Sheet>
      <Sheet accent><SectionHeading title="Endereço" icon="map-pin" /><DefinitionList columns={1} items={[
        { label: "Logradouro", value: `${person.address.street}, ${person.address.streetNumber}${person.address.addressLine2 ? ` · ${person.address.addressLine2}` : ""}` },
        { label: "Bairro", value: person.address.district },
        { label: "Cidade", value: `${person.address.city}/${person.address.stateCode}` },
        { label: "CEP", value: person.address.postalCode, mono: true },
        { label: "País", value: person.address.countryCode },
      ]} /></Sheet>
    </div>}
  </>;
}
