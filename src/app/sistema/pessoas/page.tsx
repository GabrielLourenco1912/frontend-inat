import { PeopleList } from "@/components/portal/PeopleList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { PersonCreator } from "@/components/portal/ResourceCreators";
import { serverApiAll } from "@/lib/api/server";
import type { Person } from "@/lib/api/domain-contracts";
import { requireCapability } from "@/lib/auth/session";

export default async function PeoplePage() {
  await requireCapability("people:read");
  const people = await serverApiAll<Person>("/api/people");
  return (
    <>
      <PageHeader eyebrow="Cadastros base" title="Pessoas e responsáveis" description="Dados pessoais aparecem mascarados na listagem e são abertos somente no contexto necessário." action={<PersonCreator />} />
      <PeopleList people={people} />
    </>
  );
}
