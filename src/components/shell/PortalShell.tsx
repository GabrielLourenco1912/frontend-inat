"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/design-system/Icon";
import { can, type Actor, type Capability } from "@/domain/auth";

type NavItem = {
  label: string;
  shortLabel?: string;
  href: string;
  icon: IconName;
  capability?: Capability;
  exact?: boolean;
  adminOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navigation: NavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { label: "Central do dia", shortLabel: "Hoje", href: "/sistema", icon: "home", exact: true },
      { label: "Agenda", href: "/sistema/agenda", icon: "calendar", capability: "agenda:read" },
      { label: "Avisos", href: "/sistema/avisos", icon: "bell" },
    ],
  },
  {
    label: "Acadêmico",
    items: [
      { label: "Aulas e chamada", shortLabel: "Aulas", href: "/sistema/aulas", icon: "book", capability: "lessons:read" },
      { label: "Atividades e correções", shortLabel: "Atividades", href: "/sistema/atividades", icon: "clipboard", capability: "activities:read" },
      { label: "Turmas e matrículas", href: "/sistema/turmas", icon: "layers", capability: "cohorts:read" },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { label: "Aprendizes", href: "/sistema/aprendizes", icon: "graduation", capability: "learners:read" },
      { label: "Pessoas e responsáveis", href: "/sistema/pessoas", icon: "people", capability: "people:read" },
    ],
  },
  {
    label: "Parcerias",
    items: [
      { label: "Organizações", href: "/sistema/organizacoes", icon: "building", capability: "organizations:read" },
      { label: "Contratos", href: "/sistema/contratos", icon: "briefcase", capability: "contracts:read" },
    ],
  },
  {
    label: "Operação",
    items: [
      { label: "Documentos", href: "/sistema/documentos", icon: "document", capability: "documents:read" },
      { label: "Comunicações", href: "/sistema/comunicacoes", icon: "message", capability: "communications:manage" },
    ],
  },
  {
    label: "Gestão do sistema",
    items: [
      { label: "Usuários", href: "/sistema/administracao/usuarios", icon: "person", capability: "administration:read" },
      { label: "Papéis e acessos", href: "/sistema/administracao/papeis", icon: "shield", capability: "administration:manage", adminOnly: true },
      { label: "Tipos de documento", href: "/sistema/administracao/tipos-de-documento", icon: "folder", capability: "administration:read" },
    ],
  },
];

const pathLabels: Record<string, string> = {
  sistema: "Central do dia",
  agenda: "Agenda",
  aulas: "Aulas",
  atividades: "Atividades",
  aprendizes: "Aprendizes",
  pessoas: "Pessoas",
  organizacoes: "Organizações",
  contratos: "Contratos",
  turmas: "Turmas",
  documentos: "Documentos",
  comunicacoes: "Comunicações",
  avisos: "Avisos",
  "minha-conta": "Minha conta",
  administracao: "Administração",
  usuarios: "Usuários",
  papeis: "Papéis",
  "tipos-de-documento": "Tipos de documento",
  "sem-acesso": "Acesso restrito",
};

function isItemActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isItemActive(pathname, item);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group relative flex min-h-10 items-center gap-3 px-3 py-2 text-[0.8125rem] font-medium transition ${
        active
          ? "bg-white/10 text-white"
          : "text-white/64 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {active ? (
        <span className="absolute inset-y-2 left-0 w-[3px] bg-[var(--inat-clay)]" />
      ) : null}
      <Icon name={item.icon} className="size-[1.125rem] shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export function PortalShell({
  actor,
  unreadCount,
  children,
}: {
  actor: Actor;
  unreadCount: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const groups = useMemo(
    () =>
      navigation
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) => !item.capability || can(actor, item.capability),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [actor],
  );

  const allItems = groups.flatMap((group) => group.items);
  const preferredMobileHrefs = [
    "/sistema",
    "/sistema/agenda",
    "/sistema/aulas",
    "/sistema/atividades",
    "/sistema/aprendizes",
    "/sistema/organizacoes",
  ];
  const mobileItems = preferredMobileHrefs
    .map((href) => allItems.find((item) => item.href === href))
    .filter((item): item is NavItem => Boolean(item))
    .slice(0, 4);

  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, list) => ({
      label:
        pathLabels[segment] ?? (index === list.length - 1 ? "Detalhe" : "Registro"),
      href: `/${list.slice(0, index + 1).join("/")}`,
    }));

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <div className="min-h-svh bg-[var(--inat-paper)] text-[var(--inat-ink)]">
      <a
        href="#portal-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 bg-white px-4 py-3 text-sm font-semibold text-[var(--inat-ink)] shadow-lg focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[15.5rem] flex-col bg-[var(--inat-ink)] lg:flex">
        <div className="flex h-[4.5rem] items-center border-b border-white/10 px-5">
          <Link href="/sistema" aria-label="Central do sistema INAT">
            <Image
              src="/brand/inat-logo-footer.png"
              alt="INAT Paranaguá"
              width={420}
              height={105}
              priority
              className="h-auto w-[11.75rem]"
            />
          </Link>
        </div>
        <div className="border-b border-white/10 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.14em] text-white/45">
              Portal de operação
            </p>
            <span className="border border-[var(--inat-clay)]/60 px-1.5 py-0.5 font-mono text-[0.5625rem] font-bold uppercase tracking-wide text-[#f2a77d]">
              API integrada
            </span>
          </div>
        </div>
        <nav
          className="portal-scrollbar flex-1 overflow-y-auto px-3 py-4"
          aria-label="Navegação do sistema"
        >
          {groups.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-3 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.13em] text-white/35">
                {group.label}
              </p>
              <div className="grid gap-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <Link
          href="/sistema/minha-conta"
          className="flex items-center gap-3 border-t border-white/10 px-4 py-4 transition hover:bg-white/[0.05]"
        >
          <span className="grid size-9 shrink-0 place-items-center bg-[var(--inat-teal)] text-xs font-bold text-white">
            {actor.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              {actor.name}
            </span>
            <span className="mt-0.5 block truncate text-[0.6875rem] text-white/50">
              {actor.roleLabel}
            </span>
          </span>
          <Icon name="chevron-right" className="size-4 text-white/40" />
        </Link>
      </aside>

      <div className="lg:pl-[15.5rem]">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[var(--inat-line)] bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-[4.5rem] lg:px-8">
          <Link href="/sistema" className="mr-3 lg:hidden" aria-label="Central do dia">
            <Image
              src="/brand/inat-logo.png"
              alt="INAT"
              width={500}
              height={500}
              className="size-9"
            />
          </Link>
          <nav
            className="hidden min-w-0 items-center gap-1 text-xs text-[var(--inat-muted)] sm:flex"
            aria-label="Breadcrumb"
          >
            {crumbs.map((crumb, index) => (
              <span key={`${crumb.href}-${index}`} className="flex min-w-0 items-center gap-1">
                {index > 0 ? (
                  <Icon name="chevron-right" className="size-3.5 shrink-0 text-[var(--inat-line-strong)]" />
                ) : null}
                {index === crumbs.length - 1 ? (
                  <span className="truncate font-semibold text-[var(--inat-ink)]">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="truncate hover:text-[var(--inat-ink)]">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold sm:hidden">
            {crumbs.at(-1)?.label ?? "Sistema INAT"}
          </p>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 w-56 items-center gap-2 border border-[var(--inat-line)] bg-[var(--inat-paper)] px-3 text-left text-xs text-[var(--inat-muted)] transition hover:border-[var(--inat-teal)] md:flex"
            >
              <Icon name="search" className="size-4" />
              Buscar no portal
              <kbd className="ml-auto font-mono text-[0.625rem]">⌘ K</kbd>
            </button>
            <Link
              href="/sistema/avisos"
              className="relative grid size-9 place-items-center text-[var(--inat-muted)] hover:bg-[var(--inat-mist)] hover:text-[var(--inat-ink)]"
              aria-label={`Abrir avisos, ${unreadCount} não lidos`}
            >
              <Icon name="bell" className="size-[1.125rem]" />
              {unreadCount > 0 ? <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center bg-[var(--inat-clay)] px-1 text-[0.5625rem] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex h-9 items-center gap-2 border-l border-[var(--inat-line)] pl-2 sm:pl-3"
                aria-expanded={accountOpen}
              >
                <span className="grid size-8 place-items-center bg-[var(--inat-ink)] text-[0.6875rem] font-bold text-white">
                  {actor.initials}
                </span>
                <span className="hidden max-w-24 truncate text-xs font-semibold text-[var(--inat-ink)] xl:block">
                  {actor.shortName}
                </span>
                <Icon name="chevron-down" className="hidden size-3.5 text-[var(--inat-muted)] sm:block" />
              </button>
              {accountOpen ? (
                <div className="absolute right-0 top-12 w-64 border border-[var(--inat-line)] bg-white p-2 shadow-[0_18px_50px_-24px_rgba(32,52,54,0.45)]">
                  <div className="border-b border-[var(--inat-line)] px-3 py-2.5">
                    <p className="truncate text-sm font-semibold">{actor.name}</p>
                    <p className="mt-1 truncate text-xs text-[var(--inat-muted)]">
                      {actor.email}
                    </p>
                  </div>
                  <Link
                    href="/sistema/minha-conta"
                    onClick={() => setAccountOpen(false)}
                    className="mt-1 flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--inat-mist)]"
                  >
                    <Icon name="person" className="size-4" /> Minha conta
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    <Icon name="logout" className="size-4" />
                    {loggingOut ? "Saindo..." : "Sair do sistema"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main
          id="portal-content"
          className="mx-auto min-h-[calc(100svh-4rem)] w-full max-w-[96rem] px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:min-h-[calc(100svh-4.5rem)] lg:px-8 lg:pb-10 xl:px-10"
        >
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid h-[4.25rem] border-t border-[var(--inat-line)] bg-white/98 px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{ gridTemplateColumns: `repeat(${mobileItems.length + 1}, minmax(0, 1fr))` }}
        aria-label="Navegação principal no celular"
      >
        {mobileItems.map((item) => {
          const active = isItemActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 px-1 text-[0.625rem] font-semibold ${active ? "text-[var(--inat-teal-dark)]" : "text-[var(--inat-muted)]"}`}
            >
              {active ? (
                <span className="absolute inset-x-[28%] top-0 h-0.5 bg-[var(--inat-clay)]" />
              ) : null}
              <Icon name={item.icon} className="size-5" />
              <span className="max-w-full truncate">{item.shortLabel ?? item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-1 px-1 text-[0.625rem] font-semibold text-[var(--inat-muted)]"
        >
          <Icon name="menu" className="size-5" />
          Mais
        </button>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mais destinos">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--inat-ink)]/45"
            onClick={() => setMoreOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82svh] overflow-y-auto border-t border-[var(--inat-line)] bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--inat-line)] bg-white px-5 py-4">
              <div>
                <h2 className="font-semibold">Navegação</h2>
                <p className="mt-0.5 text-xs text-[var(--inat-muted)]">{actor.roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="grid size-10 place-items-center bg-[var(--inat-mist)]"
                aria-label="Fechar"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>
            <div className="grid gap-5 p-4">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 px-2 font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-muted)]">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex min-h-14 items-center gap-3 border p-3 text-sm font-semibold ${isItemActive(pathname, item) ? "border-[var(--inat-teal)] bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]" : "border-[var(--inat-line)] text-[var(--inat-ink)]"}`}
                      >
                        <Icon name={item.icon} className="size-[1.125rem] shrink-0" />
                        {item.shortLabel ?? item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-start bg-[var(--inat-ink)]/50 px-4 pt-[10svh]" role="dialog" aria-modal="true" aria-label="Busca do portal">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setSearchOpen(false)}
            aria-label="Fechar busca"
          />
          <div className="relative mx-auto w-full max-w-xl border border-[var(--inat-line)] bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--inat-line)] p-4">
              <Icon name="search" className="size-5 text-[var(--inat-teal-dark)]" />
              <input
                autoFocus
                placeholder="Busque uma área do portal"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-xs text-[var(--inat-muted)]">
                Esc
              </button>
            </div>
            <div className="p-2">
              <p className="px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[var(--inat-muted)]">
                Acessos rápidos
              </p>
              {allItems.slice(0, 7).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-[var(--inat-mist)]"
                >
                  <Icon name={item.icon} className="size-4 text-[var(--inat-muted)]" />
                  {item.label}
                  <Icon name="arrow-right" className="ml-auto size-4 text-[var(--inat-muted)]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
