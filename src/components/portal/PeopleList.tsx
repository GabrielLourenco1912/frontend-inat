"use client";

import { useState } from "react";
import { DataList } from "@/components/design-system/DataList";
import type { Person } from "@/lib/api/domain-contracts";
import { apiLabel, formatDate, maskTaxId } from "@/lib/api/format";
import { hasPersonType, PERSON_TYPE_OPTIONS, personTypeLabels } from "@/lib/people/person-types";

export function PeopleList({ people }: { people: Person[] }) {
  const [personType, setPersonType] = useState("");
  const records = people.filter((person) => !personType || hasPersonType(person, personType))
    .map((person) => ({
      id: person.id,
      href: `/sistema/pessoas/${person.id}`,
      name: person.fullName,
      types: personTypeLabels(person),
      document: maskTaxId(person.taxId),
      contact: person.contactEmail || person.phoneNumber,
      birthDate: formatDate(person.birthDate),
      city: `${person.address.city}/${person.address.stateCode}`,
      state: apiLabel(person.status),
    }));
  return <>
    <label className="mb-4 block max-w-xs">
      <span className="portal-label">Filtrar por tipo de pessoa</span>
      <select value={personType} onChange={(event) => setPersonType(event.target.value)} className="portal-field mt-2 h-10 w-full px-3">
        <option value="">Todos os tipos</option>
        {PERSON_TYPE_OPTIONS.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>
    <DataList key={personType} records={records} itemLabel="pessoa" searchPlaceholder="Buscar nome, tipo ou contato" emptyDescription="Nenhuma pessoa encontrada para este filtro." columns={[
      { key: "name", label: "Pessoa", primary: true },
      { key: "types", label: "Tipos" },
      { key: "document", label: "CPF", mono: true },
      { key: "contact", label: "Contato" },
      { key: "birthDate", label: "Nascimento", hideBelow: "lg" },
      { key: "city", label: "Cidade", hideBelow: "lg" },
      { key: "state", label: "Situação" },
    ]} />
  </>;
}
