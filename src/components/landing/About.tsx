import { AboutImagePlaceholder } from "@/components/placeholders/AboutImagePlaceholder";

const pillars = [
  "Formação profissional",
  "Inclusão de jovens",
  "Parceria com empresas",
  "Desenvolvimento social",
];

export function About() {
  return (
    <section id="sobre" className="scroll-mt-44 bg-white py-20 sm:py-24">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="scroll-reveal" data-reveal="left">
          {/* TODO: Replace this SVG with a real INAT image after authorization. */}
          <AboutImagePlaceholder className="card-simple w-full p-2" />
        </div>
        <div className="scroll-reveal flex flex-col justify-center" data-reveal="right">
          <p className="section-eyebrow">Sobre o INAT</p>
          <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">
            Formação, orientação e oportunidade para a juventude
          </h2>
          <p className="section-copy mt-6 text-lg leading-8">
            O INAT Paranaguá é uma instituição voltada à aprendizagem
            profissional e ao desenvolvimento de jovens para o mercado de
            trabalho. Por meio de formação, orientação e parceria com empresas,
            contribui para a inclusão social, o primeiro emprego e o
            fortalecimento da responsabilidade social no município.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <article
                key={pillar}
                className="card-muted p-5"
              >
                <span className="mb-4 block size-4 rotate-45 bg-[var(--inat-cta)]" />
                <h3 className="text-base font-semibold text-[var(--inat-primary)]">
                  {pillar}
                </h3>
                <p className="section-copy mt-2 text-sm leading-6">
                  Atuação integrada para preparar jovens, famílias e empresas
                  para trajetórias profissionais responsáveis.
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
