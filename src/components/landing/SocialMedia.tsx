import { Icon } from "@/components/design-system/Icon";
import { SocialIcon } from "@/components/landing/SocialIcon";
import { SOCIAL_LINKS } from "@/lib/constants";

export function SocialMedia() {
  return (
    <section id="redes-sociais" className="scroll-mt-24 bg-[var(--inat-paper)] py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:px-8">
        <div className="scroll-reveal" data-reveal="left"><p className="section-eyebrow">Acompanhe de perto</p><h2 className="section-title mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">O INAT também acontece nas redes.</h2><p className="section-copy mt-4 max-w-xl text-sm leading-7">Oportunidades, formações, eventos e histórias do nosso trabalho em Paranaguá.</p></div>
        <div className="grid gap-3 sm:grid-cols-3">{SOCIAL_LINKS.map((link, index) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="scroll-reveal group flex min-h-24 items-center gap-4 border border-[var(--inat-line)] bg-white p-4 transition hover:border-[var(--inat-teal)]" data-reveal={index % 2 ? "right" : "left"}><span className="grid size-10 place-items-center bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]"><SocialIcon label={link.label} className="size-4" /></span><span className="font-semibold text-[var(--inat-ink)]">{link.label}</span><Icon name="external" className="ml-auto size-4 text-[var(--inat-muted)] transition group-hover:text-[var(--inat-teal-dark)]" /></a>)}</div>
      </div>
    </section>
  );
}
