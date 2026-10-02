"use client";

import { MaskedInput } from "@/components/design-system/MaskedInput";
import { SearchSelect } from "@/components/design-system/SearchSelect";
import type { Address } from "@/lib/api/domain-contracts";
import { paranaCityOption, paranaCityOptions } from "@/lib/inputs/address";

export function AddressFields({ address }: { address?: Address }) {
  return <fieldset className="grid gap-4 border border-[var(--inat-line)] p-4 sm:grid-cols-2">
    <legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Endereço obrigatório</legend>
    <label><span className="portal-label">CEP</span><MaskedInput name="postalCode" mask="postalCode" defaultValue={address?.postalCode ?? ""} className="portal-field mt-2 h-10 w-full px-3" required /></label>
    <label><span className="portal-label">Logradouro</span><input name="street" defaultValue={address?.street ?? ""} maxLength={150} className="portal-field mt-2 h-10 w-full px-3" required /></label>
    <label><span className="portal-label">Número</span><input name="streetNumber" defaultValue={address?.streetNumber ?? ""} maxLength={20} className="portal-field mt-2 h-10 w-full px-3" required /></label>
    <label><span className="portal-label">Complemento</span><input name="addressLine2" defaultValue={address?.addressLine2 ?? ""} maxLength={100} className="portal-field mt-2 h-10 w-full px-3" /></label>
    <label><span className="portal-label">Bairro</span><input name="district" defaultValue={address?.district ?? ""} maxLength={100} className="portal-field mt-2 h-10 w-full px-3" required /></label>
    <label><span className="portal-label">Cidade</span><SearchSelect name="city" label="Cidade" options={paranaCityOptions} initialOption={paranaCityOption(address?.city)} required /></label>
    <label><span className="portal-label">UF</span><input name="stateCode" value="PR" readOnly className="portal-field mt-2 h-10 w-full bg-[var(--inat-paper)] px-3" /></label>
    <label><span className="portal-label">País</span><input name="countryCode" value="BR" readOnly className="portal-field mt-2 h-10 w-full bg-[var(--inat-paper)] px-3" /></label>
  </fieldset>;
}
