import { PartnerCompanies } from "@/components/landing/PartnerCompanies";

const companyCards = [
  "Apoio à aprendizagem",
  "Responsabilidade social",
  "Desenvolvimento de talentos",
  "Acompanhamento institucional",
];

export function ForCompanies() {
  return (
    <section
      id="empresas"
      className="scroll-mt-44 bg-[var(--inat-bg)] py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="scroll-reveal" data-reveal="left">
            <p className="section-eyebrow">Para empresas parceiras</p>
            <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">
              Parceria para formar talentos e fortalecer responsabilidade social
            </h2>
            <p className="section-copy mt-6 text-lg leading-8">
              O INAT apoia empresas na formação e acompanhamento de jovens
              aprendizes, contribuindo para a responsabilidade social, o
              cumprimento da legislação de aprendizagem e o desenvolvimento de
              novos talentos.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contato"
                className="btn-base btn-primary"
              >
                Seja uma empresa parceira
              </a>
              <a
                href="#contato"
                className="btn-base btn-secondary"
              >
                Fale com o INAT
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {companyCards.map((card, index) => (
              <article
                key={card}
                className="card-simple scroll-reveal p-5"
                data-reveal={index % 2 === 0 ? "right" : "left"}
              >
                <span className="mb-4 block size-4 rotate-45 bg-[var(--inat-cta)]" />
                <h3 className="font-semibold text-[var(--inat-primary)]">
                  {card}
                </h3>
                <p className="section-copy mt-2 text-sm leading-6">
                  Suporte institucional para aproximar empresas, jovens e
                  formação profissional.
                </p>
              </article>
            ))}
          </div>
        </div>

        <PartnerCompanies />
      </div>
    </section>
  );
}
