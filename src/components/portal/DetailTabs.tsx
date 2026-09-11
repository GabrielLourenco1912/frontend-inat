"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export function DetailTabs({ activeTab, tabs, label }: {
  activeTab: string;
  tabs: { id: string; label: string }[];
  label: string;
}) {
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const container = navigation.current;
    const active = container?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!container || !active) return;
    const left = active.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
    container.scrollTo({ left: Math.max(0, left - 16) });
  }, [activeTab]);
  return (
    <nav ref={navigation} aria-label={label} className="mb-5 overflow-x-auto border-b border-[var(--inat-line)]">
      <div className="flex min-w-max">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`?tab=${encodeURIComponent(tab.id)}`}
            scroll={false}
            prefetch={false}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`relative inline-flex min-h-11 items-center px-4 text-sm font-semibold ${activeTab === tab.id ? "text-[var(--inat-teal-dark)]" : "text-[var(--inat-muted)]"}`}
          >
            {tab.label}
            {activeTab === tab.id ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[var(--inat-clay)]" /> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
