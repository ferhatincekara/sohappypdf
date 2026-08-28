import { getTranslations } from "next-intl/server";
import { MarketingCanvas } from "@/features/marketing/components/marketing-canvas";
import {
  MarketingFooterSkeleton,
  MarketingHeaderSkeleton,
  PageContentSkeleton,
} from "@/features/marketing/components/page-loading-fallback";

export default async function Loading() {
  const t = await getTranslations("errors");

  return (
    <MarketingCanvas>
      <p className="sr-only" aria-live="polite">
        {t("loading")}
      </p>
      <MarketingHeaderSkeleton />
      <div className="pt-16 md:pt-20">
        <PageContentSkeleton />
        <MarketingFooterSkeleton />
      </div>
    </MarketingCanvas>
  );
}
