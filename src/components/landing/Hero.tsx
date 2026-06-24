import { INTERNAL_SYSTEM_NAV_URL } from "@/lib/constants";
import { HeroIllustration } from "@/components/placeholders/HeroIllustration";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate scroll-mt-20 overflow-hidden bg-[var(--inat-bg)] lg:scroll-mt-44"
    >
      <div className="absolute right-[7%] top-24 -z-10 size-28 rounded-full bg-[rgba(8,130,133,0.1)]" />
      <div className="absolute bottom-20 left-[5%] -z-10 size-20 rotate-45 bg-[rgba(209,107,54,0.1)]" />
      <div className="mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:min-h-[min(44rem,calc(100svh-8.75rem))] lg:grid-cols-[1fr_0.9fr] lg:gap-12 lg:px-8 lg:py-10">
        <div className="scroll-reveal max-w-3xl" data-reveal="left">
          <p className="section-eyebrow mb-4">
            Aprendizagem, inclusão e conexão com o trabalho
          </p>
          <h1 className="section-title text-balance text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Conectando jovens ao mercado de trabalho
          </h1>
          <p className="section-copy mt-5 max-w-2xl text-lg leading-8">
            O INAT Paranaguá atua na formação profissional, aprendizagem e
            encaminhamento de jovens para oportunidades que transformam o
            presente e constroem o futuro.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#sobre"
              className="btn-base btn-primary"
            >
              Conheça o INAT
            </a>
            <a
              href="#contato"
              className="btn-base btn-secondary"
            >
              Fale Conosco
            </a>
            <a
              href={INTERNAL_SYSTEM_NAV_URL}
              className="btn-base btn-cta"
            >
              Acessar Sistema
            </a>
          </div>
        </div>

        <div
          className="scroll-reveal relative mx-auto w-full max-w-[34rem] lg:ml-auto"
          data-reveal="right"
        >
          <div className="absolute -left-5 top-8 size-16 rounded-full bg-[rgba(8,130,133,0.14)]" />
          <div className="absolute -right-3 bottom-10 size-14 rotate-45 bg-[rgba(209,107,54,0.18)]" />
          {/* TODO: Replace this SVG with an authorized institutional photo when available. */}
          <HeroIllustration className="card-simple relative aspect-[31/24] w-full p-2" />
        </div>
      </div>
    </section>
  );
}
