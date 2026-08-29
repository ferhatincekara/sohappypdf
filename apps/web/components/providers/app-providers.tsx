"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { ScrollToTopOnNavigate } from "@/components/providers/scroll-to-top";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ScrollToTopOnNavigate />
      {children}
      <Toaster />
    </QueryProvider>
  );
}
