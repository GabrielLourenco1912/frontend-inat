"use client";

import Link from "next/link";
import { DetailList } from "@/components/design-system/DetailList";
import { StatusMark } from "@/components/design-system/PortalPrimitives";
import { apiLabel } from "@/lib/api/format";
import type { IconName } from "@/components/design-system/Icon";

export type DetailLinkItem = {
  id: string;
  href: string;
  title: string;
  description?: string;
  status?: string;
  searchText?: string;
};

export function DetailLinksList({ items, itemLabel, itemPlural, searchPlaceholder, emptyTitle, emptyDescription, emptyIcon }: {
  items: DetailLinkItem[];
  itemLabel: string;
  itemPlural: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon?: IconName;
}) {
  return <DetailList items={items} itemLabel={itemLabel} itemPlural={itemPlural} searchPlaceholder={searchPlaceholder}
    searchText={(item) => [item.title, item.description, item.searchText].filter(Boolean).join(" ")}
    statusOf={(item) => item.status ?? ""} emptyTitle={emptyTitle} emptyDescription={emptyDescription} emptyIcon={emptyIcon}
    renderItem={(item) => <Link key={item.id} href={item.href} className="grid gap-3 p-4 hover:bg-[var(--inat-mist)]/35 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"><div className="min-w-0"><p className="text-sm font-semibold">{item.title}</p>{item.description ? <p className="mt-1 text-xs text-[var(--inat-muted)]">{item.description}</p> : null}</div>{item.status ? <StatusMark>{apiLabel(item.status)}</StatusMark> : null}</Link>}
  />;
}
