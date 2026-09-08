import { Icon } from "@/components/design-system/Icon";

const principles = [
  {
    number: "01",
    title: "Formação com sentido",
    text: "Conteúdo que conversa com a rotina, o território e os desafios reais do trabalho.",
    icon: "book" as const,
  },
  {
    number: "02",
    title: "Acompanhamento humano",
    text: "Presença próxima para orientar jovens, famílias e empresas durante todo o percurso.",
    icon: "people" as const,
  },
  {
    number: "03",
    title: "Conexão responsável",
    text: "Parcerias que transformam a entrada no mundo do trabalho em uma experiência segura.",
    icon: "briefcase" as const,
  },
];

export function About() {
  return (
    <section id="sobre" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="scroll-reveal lg:sticky lg:top-28" data-reveal="left">
            <p className="section-eyebrow">O INAT</p>
            <h2 className="section-title mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
              Aprender. Trabalhar. Pertencer.
            </h2>
            <p className="section-copy mt-6 max-w-xl text-base leading-8 sm:text-lg">
              Em Paranaguá, o INAT aproxima juventude, educação e mundo do
              trabalho para construir trajetórias profissionais com mais
              preparo, autonomia e oportunidade.
            </p>
            <a href="#contato" className="mt-8 inline-flex items-center gap-2 border-b border-[var(--inat-clay)] pb-1 text-sm font-bold text-[var(--inat-ink)]">
              Conheça nossa atuação
              <Icon name="arrow-right" className="size-4" />
            </a>
          </div>

          <div className="border-t border-[var(--inat-line)]">
            {principles.map((principle, index) => (
              <article key={principle.number} className="scroll-reveal grid gap-5 border-b border-[var(--inat-line)] py-7 sm:grid-cols-[4rem_3rem_1fr] sm:items-start sm:py-9" data-reveal={index % 2 ? "right" : "left"}>
                <span className="font-mono text-xs font-bold text-[var(--inat-clay)]">{principle.number}</span>
                <span className="grid size-10 place-items-center bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]"><Icon name={principle.icon} className="size-[1.125rem]" /></span>
                <div><h3 className="text-xl font-semibold tracking-[-0.02em] text-[var(--inat-ink)]">{principle.title}</h3><p className="section-copy mt-3 max-w-2xl text-sm leading-7">{principle.text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
