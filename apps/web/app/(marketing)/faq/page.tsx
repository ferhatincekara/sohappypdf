import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { FaqSection } from "@/features/marketing/components/faq-section";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: t("faqTitle"),
    description: t("faqDescription"),
    path: MARKETING_PATHS.faq,
    locale,
  });
}

export default function FaqRoute() {
  return <FaqSection asPage />;
}
