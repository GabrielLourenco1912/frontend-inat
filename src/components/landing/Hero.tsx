import Image from "next/image";
import { Icon } from "@/components/design-system/Icon";
import { INTERNAL_SYSTEM_NAV_URL } from "@/lib/constants";

function JourneyCanvas() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem]">
      <div className="absolute -right-4 -top-4 hidden h-full w-full border border-[var(--inat-clay)]/35 sm:block" />
      <div className="relative border border-white/15 bg-white p-4 text-[var(--inat-ink)] shadow-[0_35px_70px_-45px_rgba(0,0,0,.75)] sm:p-5">
        <div className="flex items-center justify-between border-b border-[var(--inat-line)] pb-4">
          <div>
            <p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[var(--inat-teal-dark)]">Caderno de percurso</p>
            <p className="mt-1 text-sm font-semibold">Uma trajetória construída em conjunto</p>
          </div>
          <Image src="/brand/inat-logo.png" alt="" width={500} height={500} className="size-12" />
        </div>

        <div className="grid gap-0 py-3">
          {[
            { number: "01", title: "Formar", text: "Conhecimento que encontra a vida real", icon: "book" as const, color: "bg-[var(--inat-teal)]" },
            { number: "02", title: "Acompanhar", text: "Presença em cada etapa do percurso", icon: "people" as const, color: "bg-[var(--inat-clay)]" },
            { number: "03", title: "Conectar", text: "Jovens preparados, empresas presentes", icon: "briefcase" as const, color: "bg-[var(--inat-ink)]" },
          ].map((item, index) => (
            <div key={item.number} className="relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-[var(--inat-line)] py-4 last:border-b-0">
              {index < 2 ? <span className="absolute -bottom-2.5 left-[1.13rem] z-10 h-5 w-px bg-[var(--inat-line-strong)]" /> : null}
              <span className={`grid size-9 place-items-center text-white ${item.color}`}><Icon name={item.icon} className="size-4" /></span>
              <div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-[var(--inat-muted)]">{item.text}</p></div>
              <span className="font-mono text-[0.625rem] font-bold text-[var(--inat-muted)]">{item.number}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 border-t border-[var(--inat-line)] pt-4 text-center">
          {["Aprendiz", "INAT", "Empresa"].map((label, index) => (
            <div key={label} className="border-r border-[var(--inat-line)] px-2 last:border-r-0">
              <span className={`mx-auto mb-2 block size-2 ${index === 1 ? "rotate-45 bg-[var(--inat-clay)]" : "bg-[var(--inat-teal)]"}`} />
              <p className="text-[0.6875rem] font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 border border-white/15 bg-[var(--inat-ink)] px-4 py-3 text-white shadow-lg sm:-left-7">
        <p className="font-mono text-[0.5625rem] font-bold uppercase tracking-[0.15em] text-white/50">Território</p>
        <p className="mt-1 text-sm font-semibold">Paranaguá · Paraná</p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="inicio" className="relative isolate scroll-mt-20 overflow-hidden bg-[var(--inat-ink)] text-white">
      <div className="absolute inset-0 landing-grid opacity-30" />
      <div className="absolute -left-40 top-32 size-[28rem] rounded-full border border-white/[0.06]" />
      <div className="mx-auto grid min-h-[calc(100svh-4.75rem)] w-full max-w-[90rem] items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.03fr)_minmax(28rem,.97fr)] lg:px-8 lg:py-24">
        <div className="scroll-reveal relative z-10 max-w-3xl" data-reveal="left">
          <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#78cbc7]">
            <span className="h-px w-10 bg-[var(--inat-clay)]" />
            Aprendizagem profissional em Paranaguá
          </p>
          <h1 className="mt-7 text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl xl:text-[4.75rem]">
            O futuro começa quando a oportunidade encontra um caminho.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
            O INAT forma, acompanha e conecta jovens ao mundo do trabalho — com
            presença próxima, aprendizagem responsável e parceria com empresas.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#aprendizagem" className="btn-base btn-cta gap-2">
              Conhecer o programa
              <Icon name="arrow-right" className="size-4" />
            </a>
            <a href="#contato" className="btn-base border border-white/25 bg-white/[0.04] text-white hover:bg-white/10">
              Falar com o INAT
            </a>
            <a href={INTERNAL_SYSTEM_NAV_URL} className="btn-base text-white/72 hover:bg-white/[0.06] hover:text-white sm:px-3">
              Já faço parte
            </a>
          </div>
        </div>

        <div className="scroll-reveal relative z-10 pb-4" data-reveal="right">
          <JourneyCanvas />
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto grid max-w-[90rem] divide-y divide-white/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {[
            ["01", "Formação que prepara", "Teoria e prática no mesmo percurso"],
            ["02", "Acompanhamento próximo", "Jovem, família e empresa conectados"],
            ["03", "Impacto no território", "Talentos que fortalecem Paranaguá"],
          ].map(([number, title, text]) => (
            <div key={number} className="grid grid-cols-[2.5rem_1fr] gap-3 py-5 sm:px-5 first:pl-0 last:pr-0">
              <span className="font-mono text-xs font-bold text-[#ef9b6d]">{number}</span>
              <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-white/48">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
