import Link from "next/link";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState, PageHeader, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
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
  return <>
    <PageHeader
      eyebrow="Acompanhamento documental"
      title="Documentos expirados"
      description="Consulte os documentos vencidos e abra o cadastro da pessoa ou do aprendiz para ver o arquivo e realizar a renovação."
      action={<StatusMark tone={page.totalElements ? "danger" : "success"}>{page.totalElements} expirado(s)</StatusMark>}
    />
    <Sheet>
      {page.content.length ? <>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Documentos expirados, ordenados pela validade mais antiga</caption>
            <thead className="border-b border-[var(--inat-line)] bg-[var(--inat-paper)] text-xs text-[var(--inat-muted)]"><tr>
              <th scope="col" className="px-4 py-3 sm:px-5">Pessoa / aprendiz</th>
              <th scope="col" className="px-4 py-3">Documento</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">Vencido em</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Abrir cadastro</span></th>
            </tr></thead>
            <tbody className="divide-y divide-[var(--inat-line)]">{page.content.map((document) => {
              const owner = ownerMap.get(document.personId);
              const href = documentOwnerHref(document.personId, document.id, owner?.learnerId);
              return <tr key={document.id} className="hover:bg-[var(--inat-paper)]">
                <td className="px-4 py-4 sm:px-5"><Link prefetch={false} href={href} className="font-semibold text-[var(--inat-teal-dark)] hover:underline">{owner?.name ?? document.personId}</Link><p className="mt-1 text-xs text-[var(--inat-muted)]">{owner?.learnerId ? "Aprendiz" : "Pessoa"}</p></td>
                <td className="px-4 py-4"><p className="font-semibold">{typeMap.get(document.documentTypeId) ?? `Tipo ${document.documentTypeId}`}</p><p className="mt-1 max-w-sm break-all text-xs text-[var(--inat-muted)]">{document.file.originalName}</p></td>
                <td className="whitespace-nowrap px-4 py-4 text-rose-800">{formatDate(document.expiresOn)}</td>
                <td className="px-4 py-4"><Link prefetch={false} href={href} className="portal-button portal-button-quiet h-9 whitespace-nowrap" aria-label={`Ver documento de ${owner?.name ?? document.personId}`}>Ver cadastro<Icon name="arrow-right" className="size-4" /></Link></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <nav aria-label="Paginação dos documentos expirados" className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--inat-line)] p-4">
          <p className="text-xs text-[var(--inat-muted)]">{page.page * page.size + 1}–{page.page * page.size + page.content.length} de {page.totalElements} · Página {page.page + 1} de {page.totalPages}</p>
          <div className="flex gap-2">
            {!page.first ? <Link prefetch={false} href={`?page=${page.page}`} className="portal-button portal-button-secondary h-9">Anterior</Link> : <span aria-disabled="true" className="portal-button portal-button-secondary h-9 opacity-40">Anterior</span>}
            {!page.last ? <Link prefetch={false} href={`?page=${page.page + 2}`} className="portal-button portal-button-secondary h-9">Próxima</Link> : <span aria-disabled="true" className="portal-button portal-button-secondary h-9 opacity-40">Próxima</span>}
          </div>
        </nav>
      </> : <EmptyState title="Nenhum documento expirado" description="Não há documentos com status expirado. Para consultar ou anexar arquivos, abra a aba Documentos no cadastro de uma pessoa ou aprendiz." icon="check" />}
    </Sheet>
  </>;
}
