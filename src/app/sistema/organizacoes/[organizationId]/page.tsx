import { AttendanceExportButton } from "@/components/portal/AttendanceExportButton";
import { relatedRecords } from "@/lib/api/related";
import { DetailLinksList } from "@/components/design-system/DetailLinksList";
import { notFound } from "next/navigation";
import {
  DefinitionList,
  EmptyState,
  PageHeader,
  SectionHeading,
  Sheet,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
import { hasRole } from "@/domain/auth";
import { OrganizationMembershipManager } from "@/components/portal/OrganizationMembershipManager";
import { OrganizationEditor } from "@/components/portal/EntityEditors";
import type {
  Contract,
  Learner,
  Organization,
  OrganizationMembership,
  OrganizationType,
  Person,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDate, formatPeriod, maskTaxId } from "@/lib/api/format";
import { serverApiAll, serverApiGet, serverApiGetOrNull } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const [actor, { organizationId }] = await Promise.all([
    requireCapability("organizations:read"),
    params,
  ]);
  const organization = await serverApiGetOrNull<Organization>(
    `/api/organizations/${encodeURIComponent(organizationId)}`,
  );
  if (!organization) notFound();

  const contracts = await serverApiGet<Contract[]>(
    `/api/contracts/organization/${encodeURIComponent(organization.id)}`,
  );
  const learnerIds = [...new Set(contracts.map((contract) => contract.learnerId))];
  const relatedLearners = (
    await Promise.all(
      learnerIds.map((id) =>
        serverApiGetOrNull<Learner>(`/api/learners/${encodeURIComponent(id)}`),
      ),
    )
  ).filter((value): value is Learner => value !== null);

  const admin = hasRole(actor, "ADMIN");
  const memberships = admin ? (await serverApiAll<OrganizationMembership>("/api/organization-memberships")).filter((item) => item.organizationId === organization.id) : [];
  const people = admin ? await relatedRecords<Person>("people", [...memberships.map((item) => item.personId), ...relatedLearners.map((item) => item.personId)]) : [];
  const personMap = new Map(people.map((person) => [person.id, person.fullName]));
  const learnerPersonMap = new Map(
    relatedLearners.map((learner) => [learner.id, personMap.get(learner.personId)]),
  );
  const requiredTypes: OrganizationType[] = [
    ...(contracts.some((contract) => contract.employerId === organization.id) ? ["EMPLOYER" as const] : []),
    ...(contracts.some((contract) => contract.schoolId === organization.id) ? ["SCHOOL" as const] : []),
  ];
  const typeLabel = organization.organizationTypes.map(apiLabel).sort().join(", ");

  return (
    <>
      <PageHeader
        eyebrow={typeLabel}
        title={organization.tradeName || organization.legalName}
        description={organization.legalName}
        backHref="/sistema/organizacoes"
        backLabel="Voltar para organizações"
        action={<StatusMark>{apiLabel(organization.status)}</StatusMark>}
      />
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Sheet>
          <SectionHeading title="Identificação e contato" icon="building" action={admin ? <OrganizationEditor organization={organization} hasContracts={contracts.length > 0} requiredTypes={requiredTypes} /> : undefined} />
          <DefinitionList columns={2} items={[
            { label: "Razão social", value: organization.legalName },
            { label: "Nome fantasia", value: organization.tradeName || "Não informado" },
            { label: "CNPJ", value: maskTaxId(organization.taxId), mono: true },
            { label: "Tipos", value: typeLabel },
            { label: "E-mail", value: organization.contactEmail },
            { label: "Telefone", value: organization.phoneNumber },
            { label: "Fechamento de ponto", value: organization.attendanceClosingDay ? `Dia ${organization.attendanceClosingDay} de cada mês` : "Não informado" },
            { label: "Logradouro", value: `${organization.address.street}, ${organization.address.streetNumber}` },
            { label: "Cidade", value: `${organization.address.city}/${organization.address.stateCode}` },
            { label: "CEP", value: organization.address.postalCode, mono: true },
            { label: "Organização superior", value: organization.parentOrganizationId || "Nenhuma", mono: Boolean(organization.parentOrganizationId) },
          ]} />
        </Sheet>
        <Sheet accent>
          <SectionHeading title="Vínculos" icon="people" />
          <div className="grid grid-cols-2 divide-x divide-[var(--inat-line)] border-b border-[var(--inat-line)]">
            <div className="p-5"><strong className="block font-mono text-2xl">{String(relatedLearners.length).padStart(2, "0")}</strong><span className="mt-2 block text-xs text-[var(--inat-muted)]">Aprendizes relacionados</span></div>
            <div className="p-5"><strong className="block font-mono text-2xl">{String(contracts.length).padStart(2, "0")}</strong><span className="mt-2 block text-xs text-[var(--inat-muted)]">Contratos relacionados</span></div>
          </div>
          <DefinitionList columns={1} items={[
            { label: "Criada em", value: formatDate(organization.createdAt.slice(0, 10)) },
            { label: "Situação", value: apiLabel(organization.status) },
          ]} />
        </Sheet>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Sheet>
          <SectionHeading title="Aprendizes vinculados" icon="graduation" stackOnMobile action={admin ? <AttendanceExportButton scope="organizations" id={organization.id} /> : undefined} />
          <DetailLinksList items={relatedLearners.map((learner) => {
            const contract = contracts.find((item) => item.learnerId === learner.id);
            return { id: learner.id, href: `/sistema/aprendizes/${learner.id}`, title: learnerPersonMap.get(learner.id) || String(learner.registrationNumber),
              description: contract ? formatPeriod(contract.startDate, contract.endDate) : "Contrato relacionado",
              searchText: `${learner.registrationNumber} ${contract?.id ?? ""}`, status: learner.status };
          })} itemLabel="aprendiz" itemPlural="aprendizes" searchPlaceholder="Buscar aprendiz ou matrícula"
            emptyTitle="Nenhum aprendiz relacionado" emptyDescription="Não há contratos desta organização vinculados a aprendizes." emptyIcon="graduation" />
        </Sheet>
        {admin ? <OrganizationMembershipManager organizationId={organization.id} memberships={memberships} people={people} /> : <Sheet><SectionHeading title="Membros da organização" description="A função de negócio não substitui o papel de acesso ao sistema." icon="people" /><EmptyState title="Membros protegidos" description="A listagem de vínculos é restrita à administração no backend." icon="shield" /></Sheet>}
      </div>
    </>
  );
}
