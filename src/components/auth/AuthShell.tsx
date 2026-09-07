import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/design-system/Icon";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-svh bg-[var(--inat-paper)] lg:grid-cols-[minmax(22rem,0.88fr)_minmax(34rem,1.12fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--inat-ink)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 auth-grid opacity-30" />
        <div className="absolute -bottom-28 -right-24 size-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-10 -right-8 size-64 rounded-full border border-[var(--inat-clay)]/40" />
        <div className="relative">
          <Link href="/" aria-label="Voltar para o site do INAT">
            <Image
              src="/brand/inat-logo-footer.png"
              alt="INAT Paranaguá"
              width={520}
              height={130}
              priority
              className="h-auto w-64"
            />
          </Link>
        </div>

        <div className="relative max-w-xl py-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#f0a278]">
            Caderno de percurso
          </p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.035em] xl:text-5xl">
            Cada registro conta uma parte da trajetória.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/68">
            Aulas, frequência, atividades, contratos e documentos reunidos em
            uma mesa de trabalho feita para a rotina do INAT.
          </p>

          <div className="mt-10 grid max-w-lg gap-4">
            {[
              ["calendar", "O dia começa pelo que precisa de atenção"],
              ["people", "Cada ação mantém aprendiz e contexto visíveis"],
              ["shield", "O acesso respeita o papel de cada pessoa"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/78">
                <span className="grid size-9 place-items-center border border-white/15 bg-white/[0.05] text-[#75c5c2]">
                  <Icon name={icon as "calendar"} className="size-4" />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">
          Portal acadêmico e administrativo · INAT Paranaguá
        </p>
      </section>

      <section className="relative flex min-h-svh items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="absolute left-4 top-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--inat-muted)] hover:text-[var(--inat-ink)] sm:left-8 sm:top-7 lg:left-auto lg:right-10"
        >
          <Icon name="arrow-left" className="size-4" />
          Voltar ao site
        </Link>
        <div className="w-full max-w-[32rem] py-12">
          <div className="mb-8 lg:hidden">
            <Image
              src="/brand/inat-logo-header.png"
              alt="INAT Paranaguá"
              width={500}
              height={125}
              priority
              className="h-auto w-60"
            />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
