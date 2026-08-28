"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEVELOPER_TOC_IDS,
  DEVELOPER_TOC_OFFSET_PX,
  type DeveloperTocId,
  resolveActiveTocId,
} from "../lib/developer-toc";

export function DeveloperDocsToc({
  ariaLabel,
  heading,
  items,
}: {
  ariaLabel: string;
  heading: string;
  items: readonly { id: DeveloperTocId; label: string }[];
}) {
  const [activeId, setActiveId] = useState<DeveloperTocId>(
    DEVELOPER_TOC_IDS[0],
  );

  useEffect(() => {
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const sections = items.flatMap((item) => {
          const element = document.getElementById(item.id);

          if (element === null) {
            return [];
          }

          return [{ id: item.id, top: element.getBoundingClientRect().top }];
        });
        const nextId = resolveActiveTocId(sections, DEVELOPER_TOC_OFFSET_PX);
        const nextItem = items.find((item) => item.id === nextId);

        if (nextItem !== undefined) {
          setActiveId(nextItem.id);
        }
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("hashchange", update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("hashchange", update);
    };
  }, [items]);

  return (
    <nav
      aria-label={ariaLabel}
      className="hidden lg:sticky lg:top-28 lg:block lg:self-start"
    >
      <p className="px-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        {heading}
      </p>
      <ul className="mt-4 flex flex-col gap-1 text-sm">
        {items.map((item) => {
          const active = item.id === activeId;

          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full items-center justify-start rounded-full px-3 py-1.5 text-left font-semibold transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => {
                  setActiveId(item.id);
                }}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
