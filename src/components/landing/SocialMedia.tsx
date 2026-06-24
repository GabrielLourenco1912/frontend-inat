import { SOCIAL_LINKS } from "@/lib/constants";
import { SocialPostPlaceholder } from "@/components/placeholders/SocialPostPlaceholder";
import { SocialIcon } from "@/components/landing/SocialIcon";

export function SocialMedia() {
  return (
    <section
      id="redes-sociais"
      className="scroll-mt-44 bg-white py-20 sm:py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="scroll-reveal" data-reveal="left">
          <p className="section-eyebrow">Redes sociais</p>
          <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">
            Acompanhe oportunidades, eventos e formações
          </h2>
          <p className="section-copy mt-6 text-lg leading-8">
            Acompanhe o INAT nas redes sociais e fique por dentro de
            oportunidades, eventos, formações e ações com os jovens aprendizes.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-muted flex items-center gap-4 p-5 font-semibold text-[var(--inat-primary)] transition hover:bg-white"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-[var(--inat-secondary)] shadow-[inset_0_0_0_1px_rgba(32,52,54,0.08)]">
                  <SocialIcon label={link.label} className="size-5" />
                </span>
                <span>
                  {link.label}
                  <span className="section-copy mt-1 block text-sm font-normal">
                    Abrir em nova aba
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* TODO: Replace placeholders with authorized screenshots or embedded official posts. */}
          <SocialPostPlaceholder
            title="Publicação institucional"
            className="scroll-reveal"
            revealDirection="right"
          />
          <SocialPostPlaceholder
            title="Oportunidades e avisos"
            className="scroll-reveal"
            revealDirection="right"
          />
          <SocialPostPlaceholder
            title="Eventos e formações"
            className="scroll-reveal sm:col-span-2"
            revealDirection="up"
          />
        </div>
      </div>
    </section>
  );
}
