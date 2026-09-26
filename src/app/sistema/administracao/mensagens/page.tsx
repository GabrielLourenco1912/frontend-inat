import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import type { ContactMessage } from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime } from "@/lib/api/format";
import { serverListPage } from "@/lib/api/pagination";
import { requireCapability } from "@/lib/auth/session";
import { paginationProps, queryValue, type ListPageProps } from "@/lib/pagination";
import { contactMessageStatusOptions } from "@/lib/status-filters";

export default async function ContactMessagesPage({ searchParams }: ListPageProps) {
  await requireCapability("administration:read");
  const query = await searchParams ?? {};
  const page = await serverListPage<ContactMessage>("/api/contact-messages", query);
  const records = page.content.map((message) => ({
    id: message.id,
    href: `/sistema/administracao/mensagens/${encodeURIComponent(message.id)}`,
    name: message.name,
    email: message.email,
    contactType: apiLabel(message.contactType),
    receivedAt: formatDateTime(message.createdAt),
    state: apiLabel(message.status),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Mensagens de contato"
        description="Solicitações enviadas pelo formulário público da página inicial. Somente administradores podem acessar esta caixa de entrada."
      />
      <DataList
        key={`${page.page}:${paginationProps(page, query).search}`}
        pagination={paginationProps(page, query)}
        statusOptions={contactMessageStatusOptions}
        selectedStatus={queryValue(query.status) ?? ""}
        records={records}
        itemLabel="mensagem"
        searchPlaceholder="Buscar nome, e-mail ou conteúdo"
        emptyIcon="mail"
        emptyTitle="Nenhuma mensagem recebida"
        emptyDescription="As mensagens enviadas pela landing page aparecerão aqui."
        columns={[
          { key: "name", label: "Contato", primary: true },
          { key: "email", label: "E-mail" },
          { key: "contactType", label: "Perfil" },
          { key: "receivedAt", label: "Recebida em", hideBelow: "lg" },
          { key: "state", label: "Situação" },
        ]}
      />
    </>
  );
}
