import type { Address } from "@/lib/api/domain-contracts";
import { searchKey } from "@/lib/detail-filter";
import { digitsOnly } from "@/lib/inputs/masks";
import { paranaCities } from "@/lib/inputs/parana-cities";

export const paranaCityOptions = paranaCities.map((name) => ({ id: name.toUpperCase(), label: name }));

export function paranaCityOption(value?: string | null) {
  const key = searchKey(value?.trim() ?? "");
  return paranaCityOptions.find((option) => searchKey(option.id) === key);
}

export function addressFrom(form: FormData): Omit<Address, "id" | "createdAt" | "updatedAt"> {
  const city = paranaCityOption(String(form.get("city") ?? ""));
  if (!city) throw new Error("Selecione uma cidade do Paraná nos resultados da busca.");
  return {
    postalCode: digitsOnly(String(form.get("postalCode") ?? "")),
    street: String(form.get("street") ?? "").trim().toUpperCase(),
    streetNumber: String(form.get("streetNumber") ?? "").trim().toUpperCase(),
    addressLine2: String(form.get("addressLine2") ?? "").trim().toUpperCase() || null,
    district: String(form.get("district") ?? "").trim().toUpperCase(),
    city: city.id,
    stateCode: "PR",
    countryCode: "BR",
  };
}
