import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/design-system/Icon";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-slate-300 bg-slate-50 text-slate-700",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  danger: "border-rose-300 bg-rose-50 text-rose-800",
  info: "border-cyan-300 bg-cyan-50 text-cyan-900",
};

export function statusTone(label: string): StatusTone {
  const value = label.toLocaleLowerCase("pt-BR");
  if (
    value.includes("inativo") ||
    value.includes("inativa") ||
    value.includes("desativ") ||
    value.includes("bloque")
  ) {
    return "danger";
  }
  if (
    value.includes("ativo") ||
    value.includes("ativa") ||
    value.includes("presente") ||
    value.includes("conclu") ||
    value.includes("verificado") ||
    value.includes("avaliada") ||
    value.includes("entregue") ||
    value.includes("disponível") ||
    value.includes("lida")
  ) {
    return "success";
  }
  if (
    value.includes("pendente") ||
    value.includes("nova") ||
    value.includes("andamento") ||
    value.includes("atraso") ||
    value.includes("análise") ||
    value.includes("rascunho") ||
    value.includes("parcial")
  ) {
    return "warning";
  }
  if (
    value.includes("rejeitado") ||
    value.includes("expirado") ||
    value.includes("suspenso") ||
    value.includes("ausente") ||
    value.includes("falha") ||
    value.includes("cancel")
  ) {
    return "danger";
  }
  if (
    value.includes("publicada") ||
    value.includes("agendada") ||
    value.includes("justificada") ||
    value.includes("processada") ||
    value.includes("padrão")
  ) {
    return "info";
  }
  return "neutral";
}

export function StatusMark({
  children,
  tone,
  className = "",
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  const label = typeof children === "string" ? children : "";
  return (
    <span
      className={`inline-flex min-h-6 items-center border px-2 py-0.5 text-[0.6875rem] font-bold leading-4 ${toneClasses[tone ?? statusTone(label)]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Sheet({
  children,
  className = "",
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <section
      className={`border border-[var(--inat-line)] bg-white ${accent ? "border-l-[3px] border-l-[var(--inat-teal)]" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  backHref,
  backLabel = "Voltar",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="mb-6 border-b border-[var(--inat-line)] pb-5 sm:mb-7 sm:pb-6">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--inat-teal-dark)] hover:text-[var(--inat-ink)]"
        >
          <Icon name="arrow-left" className="size-4" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--inat-teal-dark)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-balance text-2xl font-semibold tracking-[-0.025em] text-[var(--inat-ink)] sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--inat-muted)] sm:text-[0.9375rem]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  icon,
  stackOnMobile = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: IconName;
  stackOnMobile?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 border-b border-[var(--inat-line)] px-4 py-4 sm:px-5 ${stackOnMobile ? "flex-col sm:flex-row" : ""}`}>
      <div className="flex min-w-0 gap-3">
        {icon ? (
          <span className="grid size-9 shrink-0 place-items-center bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
            <Icon name={icon} className="size-[1.125rem]" />
          </span>
        ) : null}
        <div>
          <h2 className="font-semibold text-[var(--inat-ink)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-[var(--inat-muted)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ActionLink({
  href,
  children,
  icon = "arrow-right",
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  icon?: IconName;
  variant?: "primary" | "secondary" | "clay" | "quiet";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`portal-button portal-button-${variant} ${className}`}
    >
      {children}
      <Icon name={icon} className="size-4" />
    </Link>
  );
}

export function MetricLink({
  href,
  value,
  label,
  detail,
  tone = "teal",
}: {
  href: string;
  value: string;
  label: string;
  detail: string;
  tone?: "teal" | "clay" | "ink";
}) {
  const colors = {
    teal: "border-t-[var(--inat-teal)]",
    clay: "border-t-[var(--inat-clay)]",
    ink: "border-t-[var(--inat-ink)]",
  };
  return (
    <Link
      href={href}
      className={`group border border-t-2 border-[var(--inat-line)] bg-white p-4 transition hover:border-[var(--inat-teal)] ${colors[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-2xl font-semibold text-[var(--inat-ink)]">
          {value}
        </span>
        <Icon
          name="arrow-right"
          className="mt-1 size-4 text-[var(--inat-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--inat-teal-dark)]"
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-[var(--inat-ink)]">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--inat-muted)]">{detail}</p>
    </Link>
  );
}

export function DefinitionList({
  items,
  columns = 2,
}: {
  items: { label: string; value: ReactNode; mono?: boolean }[];
  columns?: 1 | 2 | 3;
}) {
  const grid = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  };
  return (
    <dl className={`grid ${grid[columns]}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 border-b border-[var(--inat-line)] px-4 py-4 last:border-b-0 sm:px-5"
        >
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[var(--inat-muted)]">
            {item.label}
          </dt>
          <dd
            className={`mt-1.5 text-sm leading-6 text-[var(--inat-ink)] ${item.mono ? "font-mono" : ""}`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({
  title,
  description,
  icon = "folder",
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <div className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center border border-[var(--inat-line)] bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
          <Icon name={icon} className="size-5" />
        </span>
        <h3 className="mt-4 font-semibold text-[var(--inat-ink)]">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--inat-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}
