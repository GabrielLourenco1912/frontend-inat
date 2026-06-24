const impactThemes = [
  "Inclusão social",
  "Primeiro emprego",
  "Redução de barreiras de entrada no mercado",
  "Desenvolvimento da juventude",
  "Fortalecimento da economia local",
];

const impactNumbers = [
  { label: "Jovens impactados", number: "010" },
  { label: "Empresas parceiras", number: "020" },
  { label: "Anos de atuação", number: "030" },
];

export function Impact() {
  return (
    <section id="impacto" className="scroll-mt-44 bg-white py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="scroll-reveal" data-reveal="left">
            <p className="section-eyebrow">Impacto social</p>
            <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">
              Aprendizagem profissional como caminho de transformação
            </h2>
            <p className="section-copy mt-6 text-lg leading-8">
              A atuação institucional contribui para ampliar oportunidades,
              reduzir barreiras de acesso ao mercado de trabalho e fortalecer a
              juventude de Paranaguá em parceria com a comunidade e o setor
              produtivo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {impactThemes.map((theme, index) => (
              <article
                key={theme}
                className="card-muted scroll-reveal p-5"
                data-reveal={index % 2 === 0 ? "right" : "left"}
              >
                <h3 className="font-semibold text-[var(--inat-primary)]">
                  {theme}
                </h3>
                <p className="section-copy mt-2 text-sm leading-6">
                  Eixo institucional para gerar oportunidade, desenvolvimento e
                  participação social.
                </p>
              </article>
            ))}
          </div>
        </div>

        <div
          className="scroll-reveal mt-12 grid gap-4 rounded-lg bg-[var(--inat-primary)] p-5 text-white sm:grid-cols-2 lg:grid-cols-3"
          data-reveal="up"
        >
          {/* TODO: Replace +000 placeholders with confirmed official impact metrics. */}
          {impactNumbers.map(({ label, number }) => (
            <div key={label} className="rounded-lg bg-white/10 p-6">
              <p
                className="text-3xl font-bold"
                data-count-prefix="+"
                data-count-to={number}
              >
                +{number}
              </p>
              <p className="mt-2 text-sm font-medium text-white/75">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
