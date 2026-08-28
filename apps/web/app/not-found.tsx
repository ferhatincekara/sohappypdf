import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { toAppShellUser } from "@/features/app-shell/lib/to-app-shell-user";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { RouteStatusPage } from "@/features/marketing/components/route-status-page";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errors");

  return {
    title: t("notFoundTitle"),
    description: t("notFoundDescription"),
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function NotFound() {
  const t = await getTranslations("errors");
  let user = null;

  try {
    const session = await getWebSession();
    user = session === null ? null : toAppShellUser(session.user);
  } catch {
    user = null;
  }

  return (
    <MarketingShell user={user}>
      <main
        id="main-content"
        tabIndex={-1}
        className="relative flex flex-1 flex-col pt-16 md:pt-20 outline-none"
      >
        <RouteStatusPage
          code={t("notFoundCode")}
          title={t("notFoundTitle")}
          description={t("notFoundDescription")}
          actions={
            <>
              <Button
                className="w-full sm:w-auto"
                nativeButton={false}
                render={<Link href={MARKETING_PATHS.home} />}
              >
                {t("notFoundHome")}
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                nativeButton={false}
                render={<Link href={MARKETING_PATHS.tools} />}
              >
                {t("notFoundTools")}
              </Button>
            </>
          }
        />
      </main>
    </MarketingShell>
  );
}
