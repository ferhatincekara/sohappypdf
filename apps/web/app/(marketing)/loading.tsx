import { getTranslations } from "next-intl/server";
import { PageContentSkeleton } from "@/features/marketing/components/page-loading-fallback";

export default async function MarketingLoading() {
  const t = await getTranslations("errors");

  return (
    <div aria-busy="true">
      <p className="sr-only" aria-live="polite">
        {t("loading")}
      </p>
      <PageContentSkeleton />
    </div>
  );
}
