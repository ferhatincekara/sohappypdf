import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function buildAccountPageMetadata(
  namespace: string,
): Promise<Metadata> {
  const t = await getTranslations(namespace);

  return {
    title: t("title"),
    description: t("description"),
  };
}
