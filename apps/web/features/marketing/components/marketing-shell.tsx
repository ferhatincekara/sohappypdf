import type { ReactNode } from "react";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";

export function MarketingShell({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-background">
      <MarketingHeader isAuthenticated={isAuthenticated} />
      {children}
      <MarketingFooter isAuthenticated={isAuthenticated} />
    </div>
  );
}
