const testimonials = [
  {
    title: "Depoimento de jovem aprendiz",
    text: "Texto temporário para futura história real de jovem atendido pelo INAT.",
  },
  {
    title: "Depoimento de empresa parceira",
    text: "Texto temporário para relato institucional de uma empresa parceira.",
  },
  {
    title: "Depoimento de educador",
    text: "Texto temporário para futura fala de profissional envolvido na formação.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-[var(--inat-bg)] py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="scroll-reveal max-w-3xl" data-reveal="left">
          <p className="section-eyebrow">Histórias e depoimentos</p>
          <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">
            Espaço preparado para relatos reais
          </h2>
          <p className="section-copy mt-6 text-lg leading-8">
            Esta seção está pronta para receber depoimentos autorizados de
            jovens, empresas e educadores, sem usar nomes ou histórias reais
            antes de confirmação institucional.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.title}
              className="card-simple scroll-reveal p-6"
              data-reveal={index % 2 === 0 ? "left" : "right"}
            >
              <p className="text-4xl font-bold leading-none text-[rgba(8,130,133,0.22)]">
                &quot;
              </p>
              <h3 className="mt-4 text-lg font-semibold text-[var(--inat-primary)]">
                {testimonial.title}
              </h3>
              <p className="section-copy mt-3 text-sm leading-6">
                {testimonial.text}
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(110,117,116,0.72)]">
                Placeholder editável
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
