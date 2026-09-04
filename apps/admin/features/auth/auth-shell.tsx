import type { ReactNode } from "react";
import { AdminMark } from "@/features/shell/admin-mark";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="admin-surface relative flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex items-center gap-3">
          <AdminMark />
          <div>
            <p className="text-sm font-semibold tracking-tight">SoHappyPDF</p>
            <p className="text-xs text-muted-foreground">
              {eyebrow ?? "Operations console"}
            </p>
          </div>
        </div>
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-6">{children}</div>
        </section>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Internal administrators only. This is not the customer product login.
        </p>
      </div>
    </main>
  );
}
