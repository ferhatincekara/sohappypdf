"use client";

import { Onest } from "next/font/google";
import "./globals.css";
import { BrandLogo } from "@/components/brand-logo";
import { StatusPageChrome } from "@/features/marketing/components/status-page-chrome";
import { STATUS_PAGE_RECOVERY_LINKS } from "@/features/marketing/lib/marketing-nav";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

const onest = Onest({
  subsets: ["latin", "latin-ext"],
  variable: "--font-onest",
  weight: ["400", "700", "800"],
  display: "swap",
});

const RECOVERY_LABELS: Record<
  (typeof STATUS_PAGE_RECOVERY_LINKS)[number]["id"],
  string
> = {
  tools: "Tools",
  pricing: "Pricing",
  developers: "Developers",
};

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={onest.variable}>
      <body>
        <StatusPageChrome
          renderLogo={() => <BrandLogo title="SoHappyPDF" />}
          homeHref={MARKETING_PATHS.home}
          homeLabel="Back to home"
          menuLabel="Site"
          footerMenuLabel="Footer"
          skipLabel="Skip to content"
          links={STATUS_PAGE_RECOVERY_LINKS.map((item) => ({
            href: item.href,
            label: RECOVERY_LABELS[item.id],
          }))}
          footerBlurb="Built to make PDF work lighter, faster, and a little more cheerful. Files stay scoped to you, then they expire."
          copyright={`© ${new Date().getFullYear()} SoHappyPDF. All rights reserved.`}
        >
          <section className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center md:px-8 md:py-24">
            <p className="text-7xl font-extrabold leading-none tracking-tight text-muted-foreground/25 md:text-8xl">
              Error
            </p>
            <h1 className="mt-5 max-w-xl text-3xl font-extrabold tracking-tight md:text-5xl md:leading-tight">
              Something went wrong.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg/7 text-muted-foreground">
              The page hit an unexpected error. Try again, or go back home.
            </p>
            <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground"
                onClick={reset}
              >
                Try again
              </button>
              <a
                href={MARKETING_PATHS.home}
                className="inline-flex h-11 items-center justify-center rounded-full bg-muted px-5 text-base font-semibold text-foreground"
              >
                Back to home
              </a>
            </div>
          </section>
        </StatusPageChrome>
      </body>
    </html>
  );
}
