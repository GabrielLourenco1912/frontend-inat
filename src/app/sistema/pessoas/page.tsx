import { PERSON_TYPE_OPTIONS } from "@/lib/people/person-types";
import { PeopleList } from "@/components/portal/PeopleList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { PersonCreator } from "@/components/portal/ResourceCreators";
import { serverListPage } from "@/lib/api/pagination";
import { paginationProps, queryValue, type ListPageProps } from "@/lib/pagination";
import type { Person } from "@/lib/api/domain-contracts";
import { requireCapability } from "@/lib/auth/session";

export default async function PeoplePage({ searchParams }: ListPageProps) {
  await requireCapability("people:read");
  const query = await searchParams ?? {};
  const personType = PERSON_TYPE_OPTIONS.find((item) => item.code === queryValue(query.personType))?.code ?? "";
  const page = await serverListPage<Person>(`/api/people${personType ? `?personType=${personType}` : ""}`, query);
  const people = page.content;
  return (
    <>
      <PageHeader eyebrow="Cadastros base" title="Pessoas e responsáveis" description="Dados pessoais aparecem mascarados na listagem e são abertos somente no contexto necessário." action={<PersonCreator />} />
      <PeopleList initialPersonType={personType} key={`${personType}:${page.page}`} pagination={paginationProps(page, query)} people={people} />
    </>
  );
}
