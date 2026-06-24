import Image from "next/image";
import {
  INSTITUTION_NAME,
  INTERNAL_SYSTEM_NAV_URL,
  NAV_ITEMS,
  SOCIAL_LINKS,
} from "@/lib/constants";
import { SocialIcon } from "@/components/landing/SocialIcon";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--inat-primary)] py-12 text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr_0.7fr_0.7fr] lg:px-8">
        <div>
          <a href="#inicio" className="inline-flex items-center gap-3">
            <Image
              src="/brand/inat-logo-footer.png"
              alt={INSTITUTION_NAME}
              width={2508}
              height={627}
              className="h-16 w-auto sm:h-20"
            />
          </a>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Instituição voltada à aprendizagem profissional, inclusão de jovens,
            apoio a estagiários, aprendiz PCD e conexão com empresas parceiras.
          </p>
          <p className="mt-6 text-sm text-white/50">
            Desenvolvido para fins institucionais.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/60">
            Links rápidos
          </h2>
          <nav className="mt-5 grid gap-3" aria-label="Links do rodapé">
            {NAV_ITEMS.slice(0, 6).map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-white/70 transition hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/60">
            Redes sociais
          </h2>
          <div className="mt-5 grid gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
              >
                <SocialIcon label={link.label} className="size-4" />
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/60">
            Sistema
          </h2>
          <a
            href={INTERNAL_SYSTEM_NAV_URL}
            className="btn-base mt-5 bg-white text-[var(--inat-primary)] shadow-[0_16px_34px_-24px_rgba(255,255,255,0.9)] hover:bg-[var(--inat-cta)] hover:text-white hover:shadow-[0_18px_36px_-22px_rgba(209,107,54,0.95)]"
          >
            Sistema interno
          </a>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-7xl border-t border-white/10 px-4 pt-6 text-sm text-white/50 sm:px-6 lg:px-8">
        © {year} {INSTITUTION_NAME}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
