import { Icon } from "@/components/design-system/Icon";
import { INTERNAL_SYSTEM_URL } from "@/lib/constants";

function PortalPreview() {
  return (
    <div className="overflow-hidden border border-white/15 bg-[var(--inat-paper)] text-[var(--inat-ink)] shadow-[0_35px_80px_-40px_rgba(0,0,0,.8)]">
      <div className="flex h-10 items-center border-b border-[var(--inat-line)] bg-white px-3"><span className="size-2 bg-[var(--inat-clay)]" /><span className="ml-2 size-2 bg-[var(--inat-teal)]" /><span className="ml-2 size-2 bg-[var(--inat-line-strong)]" /><span className="mx-auto font-mono text-[0.5rem] uppercase tracking-[0.12em] text-[var(--inat-muted)]">Portal INAT</span></div>
      <div className="grid min-h-[19rem] grid-cols-[5rem_1fr] sm:grid-cols-[8rem_1fr]">
        <div className="bg-[var(--inat-ink)] p-3"><div className="h-5 w-12 bg-white/15 sm:w-20" /><div className="mt-7 grid gap-3">{[0,1,2,3,4].map((item) => <div key={item} className={`h-2 ${item === 0 ? "bg-white/70" : "bg-white/15"}`} />)}</div></div>
        <div className="p-4 sm:p-5">
          <p className="font-mono text-[0.5rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-teal-dark)]">Sexta-feira · 21 de agosto</p><h3 className="mt-2 text-base font-semibold sm:text-lg">Central do dia</h3>
          <div className="mt-4 grid grid-cols-3 gap-2">{[["04", "Aulas"], ["02", "Chamadas"], ["03", "Documentos"]].map(([value,label], index) => <div key={label} className={`border border-[var(--inat-line)] border-t-2 bg-white p-2 sm:p-3 ${index === 1 ? "border-t-[var(--inat-clay)]" : "border-t-[var(--inat-teal)]"}`}><strong className="font-mono text-sm sm:text-lg">{value}</strong><p className="mt-1 text-[0.5rem] text-[var(--inat-muted)] sm:text-[0.625rem]">{label}</p></div>)}</div>
          <div className="mt-3 border border-[var(--inat-line)] bg-white"><div className="border-b border-[var(--inat-line)] px-3 py-2 text-[0.5625rem] font-bold">Régua do dia</div>{[["08:00", "Comunicação no trabalho"], ["10:20", "Gestão do tempo"], ["13:30", "Cidadania digital"]].map(([time,title], index) => <div key={time} className="grid grid-cols-[2.7rem_1fr] gap-2 border-b border-[var(--inat-line)] px-3 py-2 last:border-b-0"><span className="font-mono text-[0.5rem]">{time}</span><span className={`truncate border-l-2 pl-2 text-[0.5rem] sm:text-[0.625rem] ${index === 1 ? "border-[var(--inat-clay)]" : "border-[var(--inat-teal)]"}`}>{title}</span></div>)}</div>
        </div>
      </div>
    </div>
  );
}

export function InternalSystem() {
  return (
    <section id="sistema-interno" className="scroll-mt-24 overflow-hidden bg-[var(--inat-ink)] py-20 text-white sm:py-28">
      <div className="mx-auto grid w-full max-w-[90rem] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div className="scroll-reveal" data-reveal="left">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#78cbc7]">Portal INAT</p>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-5xl">O percurso inteiro, organizado em um só lugar.</h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/65">Aulas, frequência, atividades, contratos e documentos com uma experiência própria para cada pessoa que faz parte do INAT.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><a href={INTERNAL_SYSTEM_URL} className="btn-base btn-cta gap-2">Acessar portal<Icon name="arrow-right" className="size-4" /></a><span className="text-xs text-white/45">Acesso integrado ao sistema</span></div>
        </div>
        <div className="scroll-reveal relative" data-reveal="right"><div className="absolute -right-6 -top-6 size-24 border-r border-t border-[var(--inat-clay)]/55" /><PortalPreview /></div>
      </div>
    </section>
  );
}
