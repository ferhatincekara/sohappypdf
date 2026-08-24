import { getTranslations } from "next-intl/server";
import { AccountUsageWorkspace } from "./account-usage-workspace";

export async function AccountUsagePageContent() {
  const t = await getTranslations("appShell.pages.usage");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <AccountUsageWorkspace />
    </div>
  );
}
