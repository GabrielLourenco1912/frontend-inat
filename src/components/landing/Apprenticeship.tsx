const paths = [
  { title: "Jovem aprendiz", text: "Primeira experiência profissional com formação e acompanhamento." },
  { title: "Estágio", text: "Vivência prática conectada ao aprendizado e ao planejamento de carreira." },
  { title: "Aprendiz PCD", text: "Percursos atentos à inclusão, acessibilidade e desenvolvimento individual." },
  { title: "Formação profissional", text: "Competências para comunicação, organização e convivência no trabalho." },
];

export function Apprenticeship() {
  return (
    <section id="aprendizagem" className="scroll-mt-24 bg-[var(--inat-paper)] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="scroll-reveal grid gap-7 lg:grid-cols-[1fr_0.8fr] lg:items-end" data-reveal="up">
          <div>
            <p className="section-eyebrow">Programa de aprendizagem</p>
            <h2 className="section-title mt-4 max-w-4xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl">
              Um percurso que prepara antes, acompanha durante e abre espaço para depois.
            </h2>
          </div>
          <p className="section-copy max-w-xl text-base leading-8 lg:justify-self-end">
            A formação teórica caminha junto da experiência profissional. Cada
            etapa ajuda o jovem a entender o trabalho, reconhecer suas forças e
            construir escolhas mais conscientes.
          </p>
        </div>

        <div className="mt-12 grid border border-[var(--inat-line)] bg-white md:grid-cols-2 xl:grid-cols-4">
          {paths.map((path, index) => (
            <article key={path.title} className="scroll-reveal relative border-b border-[var(--inat-line)] p-6 last:border-b-0 md:border-r md:[&:nth-child(2)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2)]:border-r xl:last:border-r-0" data-reveal={index % 2 ? "right" : "left"}>
              <span className="font-mono text-xs font-bold text-[var(--inat-clay)]">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-10 text-lg font-semibold text-[var(--inat-ink)]">{path.title}</h3>
              <p className="section-copy mt-3 text-sm leading-6">{path.text}</p>
              <span className="mt-7 flex items-center gap-2 text-xs font-bold text-[var(--inat-teal-dark)]"><span className="h-px w-6 bg-[var(--inat-teal)]" />Percurso acompanhado</span>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-0 border border-[var(--inat-line)] bg-[var(--inat-ink)] text-white lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#ef9b6d]">Como funciona</p>
            <h3 className="mt-4 max-w-md text-2xl font-semibold leading-tight sm:text-3xl">Do primeiro contato à autonomia profissional.</h3>
          </div>
          <ol className="grid sm:grid-cols-3">
            {[["Preparar", "Direitos, deveres e competências"], ["Vivenciar", "Prática com acompanhamento"], ["Projetar", "Próximos passos e carreira"]].map(([title, text], index) => (
              <li key={title} className="border-b border-white/10 p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <span className="grid size-8 place-items-center border border-white/20 font-mono text-[0.6875rem] font-bold text-[#79cbc7]">{index + 1}</span>
                <h4 className="mt-5 font-semibold">{title}</h4><p className="mt-2 text-xs leading-5 text-white/55">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
