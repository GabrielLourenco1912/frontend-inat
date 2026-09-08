const themes = ["Inclusão que abre portas", "Primeiro emprego com preparo", "Juventude com mais autonomia", "Empresas que formam junto", "Desenvolvimento para Paranaguá"];

export function Impact() {
  return (
    <section id="impacto" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="scroll-reveal" data-reveal="left">
            <p className="section-eyebrow">Impacto social</p>
            <blockquote className="mt-5 max-w-4xl text-balance text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-[var(--inat-ink)] sm:text-5xl lg:text-6xl">
              “Quando um jovem avança, uma rede inteira avança junto.”
            </blockquote>
            <p className="section-copy mt-7 max-w-2xl text-base leading-8">
              Nosso impacto acontece na soma de trajetórias bem acompanhadas:
              mais confiança para o jovem, mais responsabilidade na empresa e
              mais possibilidades para o território.
            </p>
          </div>
          <div className="scroll-reveal border-t border-[var(--inat-line)]" data-reveal="right">
            {themes.map((theme, index) => (
              <div key={theme} className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-[var(--inat-line)] py-5">
                <span className="font-mono text-xs font-bold text-[var(--inat-clay)]">0{index + 1}</span>
                <p className="font-semibold text-[var(--inat-ink)]">{theme}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
