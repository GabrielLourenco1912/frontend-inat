"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/design-system/Icon";
import {
  INSTITUTION_NAME,
  INTERNAL_SYSTEM_NAV_URL,
  NAV_ITEMS,
} from "@/lib/constants";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--inat-line)] bg-white/96 backdrop-blur-md">
      <div className="mx-auto flex h-[4.75rem] w-full max-w-[90rem] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <a href="#inicio" aria-label="Ir para o início" onClick={() => setIsOpen(false)} className="shrink-0">
          <Image
            src="/brand/inat-logo-header.png"
            alt={INSTITUTION_NAME}
            width={1000}
            height={250}
            priority
            className="h-auto w-[11.75rem] sm:w-[13rem]"
          />
        </a>

        <nav className="ml-auto hidden items-center gap-0.5 xl:flex" aria-label="Principal">
          {NAV_ITEMS.slice(1).map((item) => (
            <a key={item.href} href={item.href} className="px-3 py-2 text-[0.8125rem] font-semibold text-[var(--inat-muted)] transition hover:bg-[var(--inat-mist)] hover:text-[var(--inat-ink)]">
              {item.label}
            </a>
          ))}
          <a href="/documentacao" className="px-3 py-2 text-[0.8125rem] font-semibold text-[var(--inat-muted)] transition hover:bg-[var(--inat-mist)] hover:text-[var(--inat-ink)]">
            Documentação
          </a>
        </nav>

        <a href={INTERNAL_SYSTEM_NAV_URL} className="btn-base btn-cta ml-auto hidden gap-2 sm:inline-flex xl:ml-3">
          Acessar portal
          <Icon name="arrow-right" className="size-4" />
        </a>

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="ml-auto grid size-11 place-items-center bg-[var(--inat-mist)] text-[var(--inat-ink)] sm:ml-0 xl:hidden"
          aria-label={isOpen ? "Fechar navegação" : "Abrir navegação"}
          aria-expanded={isOpen}
          aria-controls="landing-navigation"
        >
          <Icon name={isOpen ? "close" : "menu"} className="size-5" />
        </button>
      </div>

      {isOpen ? (
        <div id="landing-navigation" className="border-t border-[var(--inat-line)] bg-white px-4 py-4 shadow-[0_20px_35px_-28px_rgba(32,52,54,.45)] xl:hidden">
          <nav className="mx-auto grid max-w-[90rem] gap-1" aria-label="Navegação mobile">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="flex min-h-11 items-center justify-between border-b border-[var(--inat-line)] px-2 text-sm font-semibold text-[var(--inat-ink)] last:border-b-0">
                {item.label}
                <Icon name="arrow-right" className="size-4 text-[var(--inat-muted)]" />
              </a>
            ))}
            <a href="/documentacao" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center justify-between border-b border-[var(--inat-line)] px-2 text-sm font-semibold text-[var(--inat-ink)]">
              Documentação
              <Icon name="arrow-right" className="size-4 text-[var(--inat-muted)]" />
            </a>
            <a href={INTERNAL_SYSTEM_NAV_URL} onClick={() => setIsOpen(false)} className="btn-base btn-cta mt-3 gap-2 sm:hidden">
              Acessar portal
              <Icon name="arrow-right" className="size-4" />
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
