import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { requireCapability } from "@/lib/auth/session";
import type { RoleRecord } from "@/lib/api/domain-contracts";
import { serverApiAll } from "@/lib/api/server";

export default async function RolesPage() {
  await requireCapability("administration:manage");
  const roles = await serverApiAll<RoleRecord>("/api/roles");
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
      <DataList
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
