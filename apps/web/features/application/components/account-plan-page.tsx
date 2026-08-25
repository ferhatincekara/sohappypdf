import { getTranslations } from "next-intl/server";
import { AccountPlanWorkspace } from "./account-plan-workspace";

export async function AccountPlanPage() {
  const t = await getTranslations("appShell.pages.plan");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <AccountPlanWorkspace />
    </div>
  );
}
