import type { ReactNode } from "react";

export type StatusPageRecoveryLink = {
  href: string;
  label: string;
};

export function StatusPageChrome({
  renderLogo,
  homeHref,
  homeLabel,
  menuLabel,
  footerMenuLabel,
  skipLabel,
  links,
  footerBlurb,
  copyright,
  children,
}: {
  renderLogo: (options?: { priority?: boolean }) => ReactNode;
  homeHref: string;
  homeLabel: string;
  menuLabel: string;
  footerMenuLabel: string;
  skipLabel: string;
  links: readonly StatusPageRecoveryLink[];
  footerBlurb: string;
  copyright: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <header className="fixed inset-x-0 top-0 z-50">
        <a
          href="#main-content"
          tabIndex={0}
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          {skipLabel}
        </a>
        <div className="h-16 md:h-20">
          <div className="mx-auto flex h-full max-w-site items-center justify-between px-5 md:px-8">
            <a href={homeHref} className="flex shrink-0 items-center">
              {renderLogo({ priority: true })}
            </a>
            <div className="flex items-center gap-2 sm:gap-3">
              <nav
                aria-label={menuLabel}
                className="hidden items-center lg:flex"
              >
                {links.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="px-3.5 py-2 text-base font-medium text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <a
                href={homeHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground"
              >
                {homeLabel}
              </a>
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="relative flex flex-1 flex-col pt-16 md:pt-20 outline-none"
      >
        {children}
      </main>

      <footer className="bg-muted">
        <div className="mx-auto flex w-full max-w-site flex-col gap-8 px-5 py-10 md:px-8 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <a href={homeHref} className="inline-flex">
                {renderLogo()}
              </a>
              <p className="mt-4 text-base text-foreground">{footerBlurb}</p>
            </div>
            <nav
              aria-label={footerMenuLabel}
              className="flex flex-wrap gap-x-5 gap-y-2"
            >
              {links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <p className="border-t border-black/10 pt-6 text-sm text-muted-foreground">
            {copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}
