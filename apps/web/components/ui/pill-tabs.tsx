"use client";

import { LayoutGroup, motion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const PILL_TRANSITION = {
  type: "spring",
  stiffness: 420,
  damping: 32,
} as const;

export type PillTabItem = {
  id: string;
  label: ReactNode;
  href?: ComponentProps<typeof Link>["href"];
};

export function PillTabs({
  layoutId,
  value,
  items,
  onValueChange,
  stretch = false,
  "aria-label": ariaLabel,
  className,
}: {
  layoutId: string;
  value: string;
  items: readonly PillTabItem[];
  onValueChange?: (id: string) => void;
  stretch?: boolean;
  "aria-label"?: string;
  className?: string;
}) {
  const list = (
    <LayoutGroup id={layoutId}>
      <div
        className={cn(
          "flex max-w-full rounded-full bg-muted p-1",
          stretch
            ? "w-full md:inline-flex md:w-fit"
            : "inline-flex w-fit flex-wrap",
          className,
        )}
      >
        {items.map((item) => {
          const active = item.id === value;
          const className = cn(
            "relative z-10 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap outline-none transition-colors md:px-5",
            stretch
              ? "flex min-w-0 flex-1 items-center justify-center md:flex-none"
              : null,
            active
              ? "text-background"
              : "text-muted-foreground hover:text-foreground",
          );
          const content = (
            <>
              {active ? (
                <motion.span
                  layoutId={`${layoutId}-pill`}
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={PILL_TRANSITION}
                />
              ) : null}
              <span className="relative z-10 inline-flex items-center gap-2.5">
                {item.label}
              </span>
            </>
          );

          if (item.href !== undefined) {
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              className={className}
              onClick={() => {
                onValueChange?.(item.id);
              }}
            >
              {content}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );

  if (ariaLabel === undefined) {
    return list;
  }

  return (
    <nav
      aria-label={ariaLabel}
      className={stretch ? "block w-full md:inline-block md:w-auto" : undefined}
    >
      {list}
    </nav>
  );
}
