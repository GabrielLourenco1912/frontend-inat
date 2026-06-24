"use client";

import Image from "next/image";
import { useState } from "react";
import {
  INSTITUTION_NAME,
  INTERNAL_SYSTEM_NAV_URL,
  NAV_ITEMS,
} from "@/lib/constants";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 shadow-[0_10px_30px_-26px_rgba(32,52,54,0.65)] backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-24 items-center justify-between gap-6">
          <a
            href="#inicio"
            className="flex items-center gap-3 font-semibold text-[var(--inat-primary)]"
            aria-label="Ir para o início"
            onClick={closeMenu}
          >
            <Image
              src="/brand/inat-logo-header.png"
              alt={INSTITUTION_NAME}
              width={260}
              height={72}
              priority
              className="h-16 w-auto sm:h-[4.5rem]"
            />
          </a>

          <a
            href={INTERNAL_SYSTEM_NAV_URL}
            className="btn-base btn-cta hidden lg:inline-flex"
          >
            Acessar Sistema
          </a>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded bg-[var(--inat-bg)] text-[var(--inat-primary)] lg:hidden"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            aria-controls="mobile-navigation"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="flex flex-col gap-1.5" aria-hidden="true">
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </div>

        <nav
          className="hidden flex-wrap justify-center gap-x-3 gap-y-2 border-t border-[var(--inat-line)] py-4 lg:flex"
          aria-label="Principal"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded px-4 py-2 text-sm font-semibold text-[var(--inat-muted)] transition hover:bg-[var(--inat-bg)] hover:text-[var(--inat-primary)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div
        id="mobile-navigation"
        className={`bg-white px-4 pb-4 shadow-[0_18px_30px_-24px_rgba(32,52,54,0.55)] lg:hidden ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <nav className="mx-auto grid max-w-7xl gap-2" aria-label="Mobile">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-3 text-sm font-semibold text-[var(--inat-muted)] hover:bg-[var(--inat-bg)] hover:text-[var(--inat-primary)]"
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}
          <a
            href={INTERNAL_SYSTEM_NAV_URL}
            className="btn-base btn-cta mt-2"
            onClick={closeMenu}
          >
            Acessar Sistema
          </a>
        </nav>
      </div>
    </header>
  );
}
