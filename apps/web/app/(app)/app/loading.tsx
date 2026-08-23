import { getTranslations } from "next-intl/server";

export default async function AppLoading() {
  const t = await getTranslations("errors");

  return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
}
