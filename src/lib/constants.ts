export const INSTITUTION_NAME = "INAT Paranaguá";
export const INSTITUTION_SHORT_NAME = "INAT";

export const INSTITUTION_ADDRESS =
  "Rua Marechal Deodoro, 149, 2º andar, Centro Histórico, Paranaguá-PR";

export const PUBLIC_DOCUMENTS = {
  regulation: "/documents/regulamento-interno-dos-aprendizes-edicao-ii.pdf",
  apprenticeManual: "/documents/manual-da-aprendizagem-profissional.pdf",
};

const configuredInternalSystemUrl =
  process.env.NEXT_PUBLIC_INTERNAL_SYSTEM_URL?.trim();

// A implantação pode sobrescrever o destino caso o portal use outro host.
export const INTERNAL_SYSTEM_URL = configuredInternalSystemUrl || "/entrar";
export const INTERNAL_SYSTEM_NAV_URL =
  configuredInternalSystemUrl || "/entrar";

export const CONTACT_INFO = {
  phone: "+55 41 3425-8112",
  phoneHref: "tel:+554134258112",
  whatsappHref: "https://wa.me/554134258112",
  email: "contato@inat.org.br",
  hours: "Segunda a sexta, 08:00–11:00 e 13:00–17:30",
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
  { label: "O INAT", href: "#sobre" },
  { label: "Programa", href: "#aprendizagem" },
  { label: "Para jovens", href: "#jovens" },
  { label: "Empresas", href: "#empresas" },
  { label: "Impacto", href: "#impacto" },
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

export const GOOGLE_MAPS_URL =
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${INSTITUTION_NAME}, ${INSTITUTION_ADDRESS}`)}`;
