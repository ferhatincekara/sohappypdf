import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <main>
      <h1>{t("notFound")}</h1>
    </main>
  );
}
