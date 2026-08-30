import { animate } from "motion/react";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { easeOutExpo } from "@/features/marketing/lib/motion-tokens";

export function shouldSmoothScrollHomeLogo(input: {
  pathname: string;
  button: number;
  metaKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}): boolean {
  if (input.pathname !== MARKETING_PATHS.home) {
    return false;
  }

  return (
    input.button === 0 &&
    !input.metaKey &&
    !input.altKey &&
    !input.ctrlKey &&
    !input.shiftKey
  );
}

export function scrollWindowToTop(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  const from = window.scrollY;

  if (from <= 0) {
    return;
  }

  void animate(from, 0, {
    duration: 0.7,
    ease: easeOutExpo,
    onUpdate(value) {
      window.scrollTo(0, value);
    },
  });
}
