import { getTranslations } from "next-intl/server";
import type { AppNavItemId } from "../config/navigation";

export async function AppSectionPlaceholder({
  section,
}: {
  section: AppNavItemId;
}) {
  const t = await getTranslations(`appShell.pages.${section}`);

  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
    </div>
  );
}
