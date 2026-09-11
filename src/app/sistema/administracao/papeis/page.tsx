import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { requireCapability } from "@/lib/auth/session";
import type { RoleRecord } from "@/lib/api/domain-contracts";
import { serverListPage } from "@/lib/api/pagination";
import { paginationProps, type ListPageProps } from "@/lib/pagination";

export default async function RolesPage({ searchParams }: ListPageProps) {
  await requireCapability("administration:manage");
  const query = await searchParams ?? {};
  const page = await serverListPage<RoleRecord>("/api/roles", query);
  const roles = page.content;
  const records = roles.map((role) => ({
    id: String(role.id),
    name: role.name,
    code: role.code,
    description: role.description ?? "—",
  }));

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Papéis e acessos"
        description="Catálogo dos quatro papéis de sistema aceitos pelo backend."
      />
      <DataList key={page.page} pagination={paginationProps(page, query)}
        records={records}
        itemLabel="papel"
        searchPlaceholder="Buscar código ou nome"
        emptyDescription="Nenhum papel foi retornado pelo backend."
        columns={[
          { key: "name", label: "Papel", primary: true },
          { key: "code", label: "Código", mono: true },
          { key: "description", label: "Escopo" },
        ]}
      />
    </>
  );
}
