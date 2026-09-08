import { Icon } from "@/components/design-system/Icon";

const partnership = [
  ["Formação", "Percursos formativos conectados às competências do trabalho."],
  ["Acompanhamento", "Canal próximo entre empresa, jovem e equipe pedagógica."],
  ["Inclusão", "Atenção à acessibilidade e às diferentes trajetórias juvenis."],
  ["Responsabilidade", "Parceria comprometida com desenvolvimento social e profissional."],
];

export function ForCompanies() {
  return (
    <section id="empresas" className="scroll-mt-24 bg-[var(--inat-mist)] py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-[90rem] gap-12 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div className="scroll-reveal" data-reveal="left">
          <p className="section-eyebrow">Para empresas</p>
          <h2 className="section-title mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl">
            Talento se desenvolve onde existe espaço para aprender.
          </h2>
          <p className="section-copy mt-6 max-w-xl text-base leading-8">
            O INAT apoia empresas na formação e no acompanhamento de jovens
            aprendizes, unindo responsabilidade social, desenvolvimento de
            talentos e uma parceria presente no dia a dia.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#contato" className="btn-base btn-primary gap-2">Quero ser parceira<Icon name="arrow-right" className="size-4" /></a>
            <a href="#contato" className="btn-base btn-secondary">Conversar com a equipe</a>
          </div>
        </div>

        <div className="grid border-t border-[var(--inat-line-strong)] sm:grid-cols-2">
          {partnership.map(([title, text], index) => (
            <article key={title} className="scroll-reveal border-b border-[var(--inat-line-strong)] p-6 sm:border-r sm:[&:nth-child(2n)]:border-r-0 sm:p-7" data-reveal={index % 2 ? "right" : "left"}>
              <div className="flex items-center justify-between"><span className="block size-3 rotate-45 bg-[var(--inat-clay)]" /><span className="font-mono text-[0.625rem] font-bold text-[var(--inat-muted)]">0{index + 1}</span></div>
              <h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="section-copy mt-3 text-sm leading-6">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
