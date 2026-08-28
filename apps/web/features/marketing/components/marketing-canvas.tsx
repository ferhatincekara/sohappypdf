import type { ReactNode } from "react";

export function MarketingCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-x-clip bg-background">
      {children}
    </div>
  );
}
