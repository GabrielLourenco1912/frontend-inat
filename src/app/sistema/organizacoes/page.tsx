import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { OrganizationCreator } from "@/components/portal/ResourceCreators";
import { can } from "@/domain/auth";
import { apiLabel, maskTaxId } from "@/lib/api/format";
import { requireCapability } from "@/lib/auth/session";
import { accessibleOrganizations } from "@/lib/portal/data";

export default async function OrganizationsPage() {
  const actor = await requireCapability("organizations:read");
  const organizations = await accessibleOrganizations(actor);
  const records = organizations.map((organization) => ({
    id: organization.id,
    href: `/sistema/organizacoes/${organization.id}`,
    name: organization.tradeName || organization.legalName,
    type: apiLabel(organization.organizationType),
    document: maskTaxId(organization.taxId),
    city: `${organization.address.city}/${organization.address.stateCode}`,
    contact: organization.contactEmail,
    state: apiLabel(organization.status),
  }));
  return (
    <>
      <PageHeader eyebrow="Parcerias" title="Organizações" description="Empresas e escolas parceiras, com vínculos e contratos relacionados." action={can(actor, "organizations:manage") ? <OrganizationCreator organizations={organizations} /> : undefined} />
      <DataList
        records={records}
        itemLabel="organização"
        searchPlaceholder="Buscar organização, CNPJ ou cidade"
        emptyDescription="Nenhuma organização acessível foi encontrada no backend."
        columns={[
          { key: "name", label: "Organização", primary: true },
          { key: "type", label: "Tipo" },
          { key: "document", label: "CNPJ", mono: true },
          { key: "city", label: "Cidade", hideBelow: "lg" },
          { key: "contact", label: "Contato", hideBelow: "lg" },
          { key: "state", label: "Situação" },
        ]}
      />
    </>
  );
}
