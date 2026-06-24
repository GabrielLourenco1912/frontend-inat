const benefits = [
  "Primeiro contato com o mercado de trabalho",
  "Desenvolvimento profissional",
  "Orientação e acompanhamento",
  "Construção de currículo",
  "Aprendizado prático e teórico",
];

export function ForYouth() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="scroll-reveal" data-reveal="left">
          <p className="section-eyebrow">Para jovens e famílias</p>
          <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">
            Apoio para começar com orientação e segurança
          </h2>
          <p className="section-copy mt-6 text-lg leading-8">
            A aprendizagem profissional aproxima jovens interessados e seus
            responsáveis de oportunidades reais, com acompanhamento para
            desenvolver postura, confiança e competências para o futuro.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#contato"
              className="btn-base btn-primary"
            >
              Quero saber mais
            </a>
            <a
              href="#contato"
              className="btn-base btn-secondary"
            >
              Entrar em contato
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit, index) => (
            <article
              key={benefit}
              className="card-muted scroll-reveal p-5"
              data-reveal={index % 2 === 0 ? "right" : "left"}
            >
              <span className="mb-4 block size-3 rounded-full bg-[var(--inat-secondary)]" />
              <h3 className="text-base font-semibold text-[var(--inat-primary)]">
                {benefit}
              </h3>
              <p className="section-copy mt-2 text-sm leading-6">
                Benefício estruturado para apoiar a transição entre estudo,
                formação e prática profissional.
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
