import { getLocale, getTranslations } from "next-intl/server";
import type { LegalPageId } from "@/features/legal/lib/legal-paths";
import { LEGAL_PATHS } from "@/features/legal/lib/legal-paths";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";

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
