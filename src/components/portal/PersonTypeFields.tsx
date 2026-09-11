import type { PersonTypeCode } from "@/lib/api/domain-contracts";
import { PERSON_TYPE_OPTIONS } from "@/lib/people/person-types";

export function PersonTypeFields({
  types = [],
  requiredType,
}: {
  types?: PersonTypeCode[];
  requiredType?: PersonTypeCode;
}) {
  return (
    <fieldset className="border border-[var(--inat-line)] p-4">
      <legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Tipos da pessoa</legend>
      <p className="mb-3 text-xs leading-5 text-[var(--inat-muted)]">
        Selecione as funções que esta pessoa pode exercer. É possível marcar mais de uma.
      </p>
      {requiredType ? <input type="hidden" name="personTypes" value={requiredType} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {PERSON_TYPE_OPTIONS.map(({ code, label }) => (
          <label key={code} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="personTypes"
              value={code}
              defaultChecked={code === requiredType || types.includes(code)}
              disabled={code === requiredType}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
