export type InputMask = "cpf" | "cnpj" | "phone" | "postalCode" | "salary";

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function phoneDigits(value: string) {
  const digits = digitsOnly(value);
  return (digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits).slice(0, 11);
}

export function parseSalary(value: string) {
  const raw = value.trim().replace(/^R\$\s*/, "").replace(/\s/g, "");
  if (!/^(?:\d+(?:,\d{0,2})?|\d{1,3}(?:\.\d{3})+(?:,\d{0,2})?|\d+\.\d{1,2})$/.test(raw)) return NaN;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : /^\d+\.\d{1,2}$/.test(raw) ? raw : raw.replace(/\./g, "");
  return Number(normalized);
}

export function formatSalary(value: string | number) {
  const amount = typeof value === "number" ? value : parseSalary(value);
  return Number.isFinite(amount) && amount > 0
    ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
    : String(value);
}

export function formatMaskedInput(mask: InputMask, value: string) {
  if (mask === "salary") {
    const raw = value.replace(/[^\d.,]/g, "");
    const separator = raw.indexOf(",");
    const whole = digitsOnly(separator < 0 ? raw : raw.slice(0, separator)).replace(/^0+(?=\d)/, "");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return separator < 0 ? grouped : `${grouped || "0"},${digitsOnly(raw.slice(separator + 1)).slice(0, 2)}`;
  }
  const digits = mask === "phone" ? phoneDigits(value) : digitsOnly(value);
  if (mask === "postalCode") {
    const code = digits.slice(0, 8);
    return code.length > 5 ? `${code.slice(0, 5)}-${code.slice(5)}` : code;
  }
  if (mask === "cpf") {
    const cpf = digits.slice(0, 11);
    return cpf.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2").replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
  }
  if (mask === "cnpj") {
    const cnpj = digits.slice(0, 14);
    return cnpj.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2").replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2").replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
  }
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  const local = digits.slice(2);
  const prefix = digits.length === 11 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${local.length > prefix ? `${local.slice(0, prefix)}-${local.slice(prefix)}` : local}`;
}
