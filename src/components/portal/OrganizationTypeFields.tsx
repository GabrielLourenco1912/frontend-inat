"use client";

import { useState } from "react";
import type { OrganizationType } from "@/lib/api/domain-contracts";

const options: Array<{ code: OrganizationType; label: string }> = [
  { code: "EMPLOYER", label: "Empresa" },
  { code: "SCHOOL", label: "Escola" },
];

export function OrganizationTypeFields({
  types = ["EMPLOYER"],
  requiredTypes = [],
}: {
  types?: OrganizationType[];
  requiredTypes?: OrganizationType[];
}) {
  const [selected, setSelected] = useState<OrganizationType[]>(
    [...new Set([...types, ...requiredTypes])],
  );

  function toggle(code: OrganizationType, checked: boolean) {
    setSelected((current) => checked
      ? [...new Set([...current, code])]
      : current.filter((item) => item !== code));
  }

  return (
    <fieldset className="border border-[var(--inat-line)] p-4 sm:col-span-2">
      <legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">
        Tipos da organização
      </legend>
      <p className="mb-3 text-xs leading-5 text-[var(--inat-muted)]">
        Selecione ao menos um tipo. Uma organização pode atuar como empresa e escola.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ code, label }, index) => {
          const locked = requiredTypes.includes(code);
          return (
            <label key={code} className="flex items-center gap-2 text-sm">
              {locked ? <input type="hidden" name="organizationTypes" value={code} /> : null}
              <input
                type="checkbox"
                name="organizationTypes"
                value={code}
                checked={selected.includes(code)}
                disabled={locked}
                required={index === 0 && selected.length === 0}
                onChange={(event) => toggle(code, event.target.checked)}
              />
              {label}{locked ? " (exigido por contrato)" : ""}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
