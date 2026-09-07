import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { PersonCreator } from "@/components/portal/ResourceCreators";
import { formatDate, maskTaxId } from "@/lib/api/format";
import { serverApiAll } from "@/lib/api/server";
import type { Person } from "@/lib/api/domain-contracts";
import { requireCapability } from "@/lib/auth/session";

export default async function PeoplePage() {
  await requireCapability("people:read");
  const people = await serverApiAll<Person>("/api/people");
  const records = people.map((person) => ({
    id: person.id,
    href: `/sistema/pessoas/${person.id}`,
    name: person.fullName,
    document: maskTaxId(person.taxId),
    contact: person.contactEmail || person.phoneNumber,
    birthDate: formatDate(person.birthDate),
    city: `${person.address.city}/${person.address.stateCode}`,
  }));
  return (
    <>
      <PageHeader eyebrow="Cadastros base" title="Pessoas e responsáveis" description="Dados pessoais aparecem mascarados na listagem e são abertos somente no contexto necessário." action={<PersonCreator />} />
      <DataList records={records} itemLabel="pessoa" searchPlaceholder="Buscar nome ou contato" emptyDescription="Nenhuma pessoa foi cadastrada no backend." columns={[
        { key: "name", label: "Pessoa", primary: true },
        { key: "document", label: "CPF", mono: true },
        { key: "contact", label: "Contato" },
        { key: "birthDate", label: "Nascimento" },
        { key: "city", label: "Cidade", hideBelow: "lg" },
      ]} />
    </>
  );
}
