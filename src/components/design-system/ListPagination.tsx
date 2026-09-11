import Link from "next/link";
import { Icon } from "@/components/design-system/Icon";

export type ListPaginationProps = {
  shown: number;
  total: number;
  page?: number;
  totalPages?: number;
  previousHref?: string;
  nextHref?: string;
};

export function ListPagination({ shown, total, page = 0, totalPages = 1, previousHref, nextHref }: ListPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--inat-line)] px-4 py-3 text-xs text-[var(--inat-muted)]">
      <span>Mostrando {shown} de {total}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono">Página {page + 1} de {Math.max(1, totalPages)}</span>
        {previousHref || nextHref ? (
          <nav aria-label="Paginação da lista" className="flex items-center gap-1">
            {previousHref ? <Link prefetch={false} href={previousHref} aria-label="Página anterior" className="inline-grid size-8 place-items-center hover:bg-[var(--inat-mist)]"><Icon name="chevron-left" className="size-4" /></Link> : null}
            {nextHref ? <Link prefetch={false} href={nextHref} aria-label="Próxima página" className="inline-grid size-8 place-items-center hover:bg-[var(--inat-mist)]"><Icon name="chevron-right" className="size-4" /></Link> : null}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
