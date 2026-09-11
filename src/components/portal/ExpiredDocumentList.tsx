import { DataList } from "@/components/design-system/DataList";
import { PageHeader, StatusMark } from "@/components/design-system/PortalPrimitives";
import type { PageResponse } from "@/lib/api/contracts";
import type { DocumentType, PersonDocument } from "@/lib/api/domain-contracts";
import { formatDate } from "@/lib/api/format";
import { documentOwnerHref } from "@/lib/documents/navigation";

export function ExpiredDocumentList({ page, documentTypes, owners }: {
  page: PageResponse<PersonDocument>;
  documentTypes: DocumentType[];
  owners: { personId: string; name: string; learnerId?: string }[];
}) {
  const typeMap = new Map(documentTypes.map((type) => [type.id, type.name]));
  const ownerMap = new Map(owners.map((owner) => [owner.personId, owner]));
  const records = page.content.map((document) => {
    const owner = ownerMap.get(document.personId);
    return {
      id: document.id,
      href: documentOwnerHref(document.personId, document.id, owner?.learnerId),
      owner: owner?.name ?? document.personId,
      document: typeMap.get(document.documentTypeId) ?? `Tipo ${document.documentTypeId}`,
      expires: formatDate(document.expiresOn),
      file: document.file.originalName,
      kind: owner?.learnerId ? "Aprendiz" : "Pessoa",
    };
  });
  return <>
    <PageHeader
      eyebrow="Acompanhamento documental"
      title="Documentos expirados"
      description="Consulte os documentos vencidos e abra o cadastro da pessoa ou do aprendiz para ver o arquivo e realizar a renovação."
      action={<StatusMark tone={page.totalElements ? "danger" : "success"}>{page.totalElements} expirado(s)</StatusMark>}
    />
    <DataList
      records={records}
      searchable={false}
      itemLabel="documento expirado"
      emptyTitle="Nenhum documento expirado"
      emptyDescription="Não há documentos com status expirado. Para consultar ou anexar arquivos, abra a aba Documentos no cadastro de uma pessoa ou aprendiz."
      emptyIcon="check"
      pagination={{
        total: page.totalElements,
        page: page.page,
        totalPages: page.totalPages,
        previousHref: !page.first ? `?page=${page.page}` : undefined,
        nextHref: !page.last ? `?page=${page.page + 2}` : undefined,
      }}
      columns={[
        { key: "owner", label: "Pessoa / aprendiz", primary: true },
        { key: "document", label: "Documento" },
        { key: "expires", label: "Vencido em" },
        { key: "file", label: "Arquivo", hideBelow: "lg" },
        { key: "kind", label: "Cadastro", hideBelow: "lg" },
      ]}
    />
  </>;
}
