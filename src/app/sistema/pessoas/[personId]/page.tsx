import { notFound } from "next/navigation";
import { DefinitionList, PageHeader, SectionHeading, Sheet } from "@/components/design-system/PortalPrimitives";
import { PersonActions } from "@/components/portal/ResourceCreators";
import type { Person } from "@/lib/api/domain-contracts";
import { formatDate, maskTaxId } from "@/lib/api/format";
import { serverApiGetOrNull } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";

import { personTypeLabels } from "@/lib/people/person-types";

export default async function PersonDetailPage({ params }: { params: Promise<{ personId: string }> }) {
  const [, { personId }] = await Promise.all([requireCapability("people:read"), params]);
  const person = await serverApiGetOrNull<Person>(`/api/people/${encodeURIComponent(personId)}`);
  if (!person) notFound();
  return <><PageHeader eyebrow="Cadastro de pessoa" title={person.fullName} description={person.contactEmail || person.phoneNumber} backHref="/sistema/pessoas" backLabel="Voltar para pessoas" action={<PersonActions person={person} />} /><div className="grid gap-5 xl:grid-cols-2"><Sheet><SectionHeading title="Identificação" icon="person" /><DefinitionList columns={2} items={[{ label: "Nome", value: person.fullName }, { label: "Tipos", value: personTypeLabels(person) }, { label: "CPF", value: maskTaxId(person.taxId), mono: true }, { label: "Nascimento", value: formatDate(person.birthDate) }, { label: "Gênero", value: person.gender || "Não informado" }, { label: "E-mail", value: person.contactEmail || "Não informado" }, { label: "Telefone", value: person.phoneNumber }]} /></Sheet><Sheet accent><SectionHeading title="Endereço" icon="map-pin" /><DefinitionList columns={1} items={[{ label: "Logradouro", value: `${person.address.street}, ${person.address.streetNumber}${person.address.addressLine2 ? ` · ${person.address.addressLine2}` : ""}` }, { label: "Bairro", value: person.address.district }, { label: "Cidade", value: `${person.address.city}/${person.address.stateCode}` }, { label: "CEP", value: person.address.postalCode, mono: true }, { label: "País", value: person.address.countryCode }]} /></Sheet></div></>;
}
