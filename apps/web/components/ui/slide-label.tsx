import type { ReactNode } from "react";

export function SlideLabel({ children }: { children: ReactNode }) {
  return (
    <span className="btn-label-slide">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}
