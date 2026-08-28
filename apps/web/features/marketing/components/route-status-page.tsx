import type { ReactNode } from "react";

export function RouteStatusPage({
  code,
  title,
  description,
  actions,
}: {
  code: string;
  title: string;
  description: string;
  actions: ReactNode;
}) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center md:px-8 md:py-24">
      <p className="text-7xl font-extrabold leading-none tracking-tight text-muted-foreground/25 md:text-8xl">
        {code}
      </p>
      <h1 className="mt-5 max-w-xl text-3xl font-extrabold tracking-tight md:text-5xl md:leading-tight">
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg/7 text-muted-foreground">
        {description}
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
        {actions}
      </div>
    </section>
  );
}
