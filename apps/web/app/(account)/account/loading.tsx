import { getTranslations } from "next-intl/server";

export default async function AccountLoading() {
  const t = await getTranslations("errors");

  return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
}
