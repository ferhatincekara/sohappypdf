import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PolarPortalActions({
  canManage,
  isPortalPending,
  onManage,
}: {
  canManage: boolean;
  isPortalPending: boolean;
  onManage: () => void;
}) {
  const t = useTranslations("billing");

  if (!canManage) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPortalPending}
        aria-busy={isPortalPending}
        onClick={onManage}
      >
        {isPortalPending ? t("openingPortal") : t("manage")}
      </Button>
      <p className="max-w-md text-xs text-muted-foreground">
        {t("portalHint")}
      </p>
    </div>
  );
}
