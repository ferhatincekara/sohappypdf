"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RouteStatusPage } from "@/features/marketing/components/route-status-page";
import { StatusPageFrame } from "@/features/marketing/components/status-page-frame";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <StatusPageFrame>
      <RouteStatusPage
        code={t("genericCode")}
        title={t("genericTitle")}
        description={t("genericDescription")}
        actions={
          <>
            <Button className="w-full sm:w-auto" onClick={reset}>
              {t("genericRetry")}
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              nativeButton={false}
              render={<Link href={MARKETING_PATHS.home} />}
            >
              {t("genericHome")}
            </Button>
          </>
        }
      />
    </StatusPageFrame>
  );
}
