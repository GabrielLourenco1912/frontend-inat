import Image from "next/image";
import { Icon } from "@/components/design-system/Icon";
import { SocialIcon } from "@/components/landing/SocialIcon";
import { INSTITUTION_NAME, INTERNAL_SYSTEM_NAV_URL, NAV_ITEMS, SOCIAL_LINKS } from "@/lib/constants";

export function Footer() {
  const year = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  return (
    <footer className="bg-[var(--inat-ink)] text-white [--inat-focus-ring:var(--inat-paper)]">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.25fr_.75fr_.75fr] lg:px-8">
        <div>
          <a href="#inicio">
            <Image src="/brand/inat-logo-footer.png" alt={INSTITUTION_NAME} width={800} height={200} className="h-auto w-64 max-w-full" />
          </a>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
            Aprendizagem profissional, acompanhamento de jovens e conexão responsável com empresas parceiras em Paranaguá.
          </p>
          <a href={INTERNAL_SYSTEM_NAV_URL} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#ef9b6d] transition hover:text-white">
            Acessar portal INAT
            <Icon name="arrow-right" className="size-4" />
          </a>
        </div>
        <div>
          <h2 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/65">Navegação</h2>
          <nav className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3" aria-label="Navegação do rodapé">
            {NAV_ITEMS.slice(1).map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-white/70 transition hover:text-white">{item.label}</a>
            ))}
            <a href="/documentacao" className="text-sm text-white/70 transition hover:text-white">Documentação</a>
          </nav>
        </div>
        <div>
          <h2 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/65">Redes sociais</h2>
          <div className="mt-5 grid gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-sm text-white/70 transition hover:text-white">
                <SocialIcon label={link.label} className="size-4" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col items-start gap-5 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6 lg:px-8">
          <div className="space-y-1 text-xs leading-6 text-white/65">
            <p>© {year} {INSTITUTION_NAME}. Todos os direitos reservados.</p>
            <p>Formação · oportunidade · futuro</p>
          </div>
          <a
            href="https://gabriellourenco.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 rounded-sm transition-opacity hover:opacity-80"
          >
            <Image
              src="/brand/gabriel-lourenco-signature.svg"
              alt="Desenvolvido por Gabriel Lourenço"
              width={260}
              height={56}
              className="h-auto w-60 max-w-full"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
