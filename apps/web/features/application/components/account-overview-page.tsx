import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { APP_PATHS } from "@/features/app-shell";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { AccountOverviewRecent } from "./account-overview-recent";
import { AccountOverviewUsage } from "./account-overview-usage";

export async function AccountOverviewPage() {
  const t = await getTranslations("appShell.pages.overview");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-foreground">
          {t("toolsTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("toolsDescription")}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={MARKETING_PATHS.tools}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            {t("chooseTool")}
          </Link>
          <Link
            href={APP_PATHS.usage}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("viewUsage")}
          </Link>
        </div>
      </section>

      <AccountOverviewUsage />
      <AccountOverviewRecent />
    </div>
  );
}
