"use client";

import { useState, type InputHTMLAttributes } from "react";
import { formatMaskedInput, formatSalary, parseSalary, type InputMask } from "@/lib/inputs/masks";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "onBlur"> & {
  mask: InputMask;
  defaultValue?: string | number | null;
};

const settings: Record<Exclude<InputMask, "salary">, { maxLength: number; pattern: string; inputMode: "numeric" | "tel" | "text" }> = {
  cpf: { maxLength: 14, pattern: "[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}", inputMode: "numeric" },
  cnpj: { maxLength: 18, pattern: "[A-Z0-9]{2}\\.[A-Z0-9]{3}\\.[A-Z0-9]{3}/[A-Z0-9]{4}-[0-9]{2}", inputMode: "text" },
  phone: { maxLength: 19, pattern: "\\([1-9][0-9]\\) (?:9[0-9]{4}|[2-5][0-9]{3})-[0-9]{4}", inputMode: "tel" },
  postalCode: { maxLength: 9, pattern: "[0-9]{5}-[0-9]{3}", inputMode: "numeric" },
};

export function MaskedInput({ mask, defaultValue, ...props }: Props) {
  const [value, setValue] = useState(() => {
    const initial = String(defaultValue ?? "");
    return mask === "salary" && initial ? formatSalary(initial) : formatMaskedInput(mask, initial);
  });
  const config = mask === "salary" ? null : settings[mask];

  return <input
    {...props}
    type={mask === "phone" ? "tel" : "text"}
    inputMode={mask === "salary" ? "decimal" : config?.inputMode}
    maxLength={mask === "salary" ? 24 : config?.maxLength}
    pattern={config?.pattern}
    value={value}
    onChange={(event) => {
      const next = formatMaskedInput(mask, event.target.value);
      setValue(next);
      if (mask === "salary") {
        const amount = parseSalary(next);
        event.target.setCustomValidity(next && (!Number.isFinite(amount) || amount <= 0) ? "Informe um salário maior que zero." : "");
      }
    }}
    onPaste={(event) => {
      if (mask !== "salary") return;
      const amount = parseSalary(event.clipboardData.getData("text"));
      if (!Number.isFinite(amount) || amount <= 0) return;
      event.preventDefault();
      event.currentTarget.setCustomValidity("");
      setValue(formatSalary(amount));
    }}
    onBlur={(event) => {
      if (mask !== "salary" || !value) return;
      const amount = parseSalary(value);
      if (!Number.isFinite(amount) || amount <= 0) {
        event.target.setCustomValidity("Informe um salário maior que zero.");
        return;
      }
      event.target.setCustomValidity("");
      setValue(formatSalary(amount));
    }}
  />;
}
