import { DashboardIllustration } from "@/components/placeholders/DashboardIllustration";
import { INTERNAL_SYSTEM_URL } from "@/lib/constants";

export function InternalSystem() {
  return (
    <section
      id="sistema-interno"
      className="scroll-mt-44 bg-[var(--inat-primary)] py-20 text-white sm:py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="scroll-reveal" data-reveal="left">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/70">
            Ambiente restrito
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Sistema de Gerenciamento Interno
          </h2>
          <p className="mt-6 text-lg leading-8 text-white/75">
            Acesse o ambiente restrito para gerenciamento de informações,
            acompanhamento de registros e administração dos processos internos
            do INAT.
          </p>
          <div className="mt-8">
            {/* TODO: Keep this link configured with NEXT_PUBLIC_INTERNAL_SYSTEM_URL. */}
            <a
              href={INTERNAL_SYSTEM_URL}
              className="btn-base btn-cta"
            >
              Acessar Sistema Web
            </a>
            <p className="mt-4 text-sm text-white/60">
              Área restrita a usuários autorizados.
            </p>
          </div>
        </div>

        <div className="scroll-reveal" data-reveal="right">
          <DashboardIllustration className="w-full rounded-lg shadow-[0_24px_70px_-48px_rgba(0,0,0,0.75)]" />
        </div>
      </div>
    </section>
  );
}
