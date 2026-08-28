import { getLocale, getTranslations } from "next-intl/server";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import type { LegalPageId } from "./legal-paths";
import { LEGAL_PATHS } from "./legal-paths";

export async function legalPageMetadata(pageId: LegalPageId) {
  const t = await getTranslations(`legal.${pageId}`);
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: t("metaTitle"),
    description: t("description"),
    path: LEGAL_PATHS[pageId],
    locale,
  });
}
