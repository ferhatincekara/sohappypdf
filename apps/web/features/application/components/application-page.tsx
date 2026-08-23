import { getTranslations } from "next-intl/server";

export async function ApplicationPage() {
  const t = await getTranslations("app");

  return (
    <div>
      <h1>{t("title")}</h1>
    </div>
  );
}
