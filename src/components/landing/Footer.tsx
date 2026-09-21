import Image from "next/image";
import { Icon } from "@/components/design-system/Icon";
import { SocialIcon } from "@/components/landing/SocialIcon";
import { INSTITUTION_NAME, INTERNAL_SYSTEM_NAV_URL, NAV_ITEMS, SOCIAL_LINKS } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[var(--inat-ink)] text-white">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.25fr_.75fr_.75fr] lg:px-8">
        <div><a href="#inicio"><Image src="/brand/inat-logo-footer.png" alt={INSTITUTION_NAME} width={800} height={200} className="h-auto w-64" /></a><p className="mt-5 max-w-md text-sm leading-7 text-white/58">Aprendizagem profissional, acompanhamento de jovens e conexão responsável com empresas parceiras em Paranaguá.</p><a href={INTERNAL_SYSTEM_NAV_URL} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#ef9b6d]">Acessar portal INAT<Icon name="arrow-right" className="size-4" /></a></div>
        <div><h2 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/40">Navegação</h2><nav className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">{NAV_ITEMS.slice(1).map((item) => <a key={item.href} href={item.href} className="text-sm text-white/62 transition hover:text-white">{item.label}</a>)}<a href="/documentacao" className="text-sm text-white/62 transition hover:text-white">Documentação</a></nav></div>
        <div><h2 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/40">Redes sociais</h2><div className="mt-5 grid gap-3">{SOCIAL_LINKS.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-sm text-white/62 transition hover:text-white"><SocialIcon label={link.label} className="size-4" />{link.label}</a>)}</div></div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex w-full max-w-[90rem] flex-col gap-2 px-4 py-5 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© {year} {INSTITUTION_NAME}. Todos os direitos reservados.</p><p>Formação · oportunidade · futuro</p></div></div>
    </footer>
  );
}
