const programCards = [
  {
    title: "Jovens aprendizes",
    text: "Apoio para o primeiro contato com rotinas profissionais, direitos, deveres e desenvolvimento de competências.",
  },
  {
    title: "Estagiários",
    text: "Orientação para vivências que aproximam formação, prática profissional e planejamento de carreira.",
  },
  {
    title: "Aprendiz PCD",
    text: "Caminhos de aprendizagem com atenção à inclusão, acessibilidade e acompanhamento institucional.",
  },
  {
    title: "Formação administrativa/profissional",
    text: "Conteúdos voltados à organização, comunicação, postura profissional e preparação para o trabalho.",
  },
];

const programHighlights = [
  {
    title: "Preparação para o primeiro emprego",
    text: "Apoio para entender rotinas, responsabilidades e expectativas do ambiente profissional.",
  },
  {
    title: "Desenvolvimento de postura profissional",
    text: "Formação para comunicação, organização, convivência e compromisso no trabalho.",
  },
  {
    title: "Inclusão e acompanhamento de jovens",
    text: "Orientação próxima durante o percurso, respeitando diferentes realidades e necessidades.",
  },
];

export function Apprenticeship() {
  return (
    <section
      id="aprendizagem"
      className="scroll-mt-44 bg-[var(--inat-bg)] py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="scroll-reveal max-w-3xl" data-reveal="left">
          <p className="section-eyebrow">Programa de Aprendizagem</p>
          <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">
            Entrada acompanhada e responsável no mercado de trabalho
          </h2>
          <p className="section-copy mt-6 text-lg leading-8">
            O programa apoia jovens em sua entrada no mercado de trabalho,
            combinando formação teórica, acompanhamento institucional e vivência
            profissional em empresas parceiras.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {programCards.map((card, index) => (
            <article
              key={card.title}
              className="card-simple scroll-reveal p-6 transition hover:-translate-y-1"
              data-reveal={index % 2 === 0 ? "left" : "right"}
            >
              <span className="mb-6 grid size-12 place-items-center rounded-full bg-[rgba(8,130,133,0.1)] text-lg font-bold text-[var(--inat-secondary)]">
                {card.title.slice(0, 1)}
              </span>
              <h3 className="text-lg font-semibold text-[var(--inat-primary)]">
                {card.title}
              </h3>
              <p className="section-copy mt-3 text-sm leading-6">
                {card.text}
              </p>
            </article>
          ))}
        </div>

        <div
          className="scroll-reveal mt-10 overflow-hidden rounded-lg bg-[var(--inat-primary)] text-white shadow-[0_24px_70px_-46px_rgba(32,52,54,0.9)]"
          data-reveal="up"
        >
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/65">
                Percurso formativo
              </p>
              <h3 className="mt-3 max-w-md text-2xl font-bold leading-tight sm:text-3xl">
                O que o jovem desenvolve durante o programa
              </h3>
            </div>

            <ul className="grid gap-4">
              {programHighlights.map((highlight, index) => (
                <li
                  key={highlight.title}
                  className="grid gap-4 border-t border-white/15 pt-4 sm:grid-cols-[3rem_1fr]"
                >
                  <span className="grid size-12 place-items-center rounded-lg bg-white/10 text-sm font-bold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="font-semibold leading-6">{highlight.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-white/72">
                      {highlight.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
