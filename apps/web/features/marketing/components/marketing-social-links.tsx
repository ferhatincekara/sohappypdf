"use client";

import type { MarketingSocialLink } from "../lib/marketing-social";
import { MarketingSocialIcon } from "./marketing-social-icon";

export function MarketingSocialLinks({
  links,
  groupLabel,
  labels,
}: {
  links: readonly MarketingSocialLink[];
  groupLabel: string;
  labels: Record<MarketingSocialLink["id"], string>;
}) {
  return (
    <nav aria-label={groupLabel} className="mt-6 flex items-center gap-2">
      {links.map((item) => (
        <a
          key={item.id}
          href={item.href}
          target="_blank"
          rel="noreferrer noopener"
          tabIndex={0}
          aria-label={labels[item.id]}
          className="flex size-10 items-center justify-center rounded-full bg-white text-foreground outline-none transition-colors hover:opacity-80"
        >
          <MarketingSocialIcon id={item.id} className="size-5" />
        </a>
      ))}
    </nav>
  );
}
