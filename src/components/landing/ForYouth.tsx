import { Icon } from "@/components/design-system/Icon";
import { PUBLIC_DOCUMENTS } from "@/lib/constants";

const steps = [
  "Conheça as possibilidades da aprendizagem profissional",
  "Converse com nossa equipe sobre o seu momento",
  "Prepare-se para oportunidades com orientação",
  "Siga acompanhado durante a experiência profissional",
];

export function ForYouth() {
  return (
    <section id="jovens" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:px-8">
        <div className="scroll-reveal relative overflow-hidden bg-[var(--inat-teal)] p-7 text-white sm:p-10 lg:p-12" data-reveal="left">
          <div className="absolute -bottom-32 -right-28 size-80 -z-10 rounded-full border border-white/15" />
          <div className="absolute -bottom-16 -right-12 size-52 -z-10 rounded-full border border-white/20" />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-white/65">Para jovens e famílias</p>
          <h2 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-5xl">
            Começar não precisa ser um passo solitário.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/75">
            O INAT ajuda a transformar dúvidas em preparação, e preparação em
            oportunidades reais — respeitando o tempo e a história de cada jovem.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <a href="#contato" className="btn-base gap-2 bg-white text-[var(--inat-teal-dark)] hover:bg-[var(--inat-paper)]">
              Quero conhecer o programa
              <Icon name="arrow-right" className="size-4" />
            </a>
            <a
              href={PUBLIC_DOCUMENTS.apprenticeManual}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
            >
              Manual da Aprendizagem Profissional (PDF)
              <Icon name="external" className="size-4" />
            </a>
          </div>
        </div>

        <div className="scroll-reveal flex flex-col justify-center border-y border-[var(--inat-line)] py-2" data-reveal="right">
          {steps.map((step, index) => (
            <div key={step} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-[var(--inat-line)] py-6 last:border-b-0 sm:px-4">
              <span className="font-mono text-xs font-bold text-[var(--inat-clay)]">{String(index + 1).padStart(2, "0")}</span>
              <div><h3 className="font-semibold leading-6 text-[var(--inat-ink)]">{step}</h3><p className="section-copy mt-2 text-sm leading-6">Orientação clara para que o próximo passo faça sentido.</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
