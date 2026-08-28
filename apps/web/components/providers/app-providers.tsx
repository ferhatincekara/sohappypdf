"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "./query-provider";
import { ScrollToTopOnNavigate } from "./scroll-to-top";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ScrollToTopOnNavigate />
      {children}
      <Toaster />
    </QueryProvider>
  );
}
