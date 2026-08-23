import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("errors");

  return (
    <main>
      <p>{t("loading")}</p>
    </main>
  );
}
