export const INSTITUTION_NAME = "INAT Paranaguá";
export const INSTITUTION_SHORT_NAME = "INAT";

export const INSTITUTION_ADDRESS =
  "Rua Marechal Deodoro, 149, 2º andar, Centro Histórico, Paranaguá-PR";

const configuredInternalSystemUrl =
  process.env.NEXT_PUBLIC_INTERNAL_SYSTEM_URL?.trim();

// TODO: Configure NEXT_PUBLIC_INTERNAL_SYSTEM_URL in the deployment environment.
export const INTERNAL_SYSTEM_URL = configuredInternalSystemUrl || "#";
export const INTERNAL_SYSTEM_NAV_URL =
  configuredInternalSystemUrl || "#sistema-interno";

export const CONTACT_INFO = {
  phone: "Telefone/WhatsApp a confirmar",
  email: "E-mail institucional a confirmar",
  hours: "Horário de atendimento a confirmar",
};

export const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/inatpgua/",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/inatpgua/",
  },
  {
    label: "LinkedIn",
    href: "https://br.linkedin.com/company/inatpgua",
  },
];

export const NAV_ITEMS = [
  { label: "Início", href: "#inicio" },
  { label: "Sobre", href: "#sobre" },
  { label: "Aprendizagem", href: "#aprendizagem" },
  { label: "Empresas", href: "#empresas" },
  { label: "Impacto", href: "#impacto" },
  { label: "Redes Sociais", href: "#redes-sociais" },
  { label: "Sistema Interno", href: "#sistema-interno" },
  { label: "Contato", href: "#contato" },
];

export type PartnerCompany = {
  name: string;
  logo: string | null;
};

// TODO: Replace placeholder names and logos with official partner company assets.
// Future logo paths can use /public/partners/nome-da-empresa.svg or .png.
export const PARTNER_COMPANIES: PartnerCompany[] = [
  { name: "Empresa Parceira 01", logo: null },
  { name: "Empresa Parceira 02", logo: null },
  { name: "Empresa Parceira 03", logo: null },
  { name: "Empresa Parceira 04", logo: null },
  { name: "Empresa Parceira 05", logo: null },
  { name: "Empresa Parceira 06", logo: null },
];

// TODO: Validate the official Google Maps URL before replacing this placeholder.
export const GOOGLE_MAPS_URL = "#";
