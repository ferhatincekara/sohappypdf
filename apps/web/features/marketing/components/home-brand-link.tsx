"use client";

import type { MouseEvent, ReactNode } from "react";
import {
  scrollWindowToTop,
  shouldSmoothScrollHomeLogo,
} from "@/features/marketing/lib/home-logo-navigation";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link, usePathname } from "@/lib/i18n/navigation";

export function HomeBrandLink({
  children,
  className,
  onNavigate,
}: {
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      !shouldSmoothScrollHomeLogo({
        pathname,
        button: event.button,
        metaKey: event.metaKey,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
      })
    ) {
      return;
    }

    event.preventDefault();
    onNavigate?.();
    scrollWindowToTop();
  }

  return (
    <Link href={MARKETING_PATHS.home} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
