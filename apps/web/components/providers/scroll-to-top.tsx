"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "@/lib/i18n/navigation";

export function ScrollToTopOnNavigate() {
  const pathname = usePathname();

  // Reset window scroll after client navigations. Pathname is the trigger.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the navigation trigger
  useLayoutEffect(() => {
    if (window.location.hash !== "") {
      return;
    }

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
