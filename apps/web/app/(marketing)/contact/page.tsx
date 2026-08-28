import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ContactPageContent } from "@/features/marketing/components/contact-page-content";
import { buildMarketingPageMetadata } from "@/features/marketing/lib/marketing-page-metadata";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");
  const locale = await getLocale();

  return buildMarketingPageMetadata({
    title: t("contactTitle"),
    description: t("contactDescription"),
    path: MARKETING_PATHS.contact,
    locale,
  });
}

export default function ContactRoute() {
  return <ContactPageContent />;
}
