"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { loginPath } from "@/features/auth/paths";
import { Link } from "@/lib/i18n/navigation";
import type { ToolSelectedUxState } from "../types/tool-ux-state";

export function ToolSelectedActions({
  toolRoute,
  state,
  canProcess,
  processLabel,
  disabledReason,
  onProcess,
}: {
  toolRoute: `/${string}`;
  state: ToolSelectedUxState;
  canProcess: boolean;
  processLabel: string;
  disabledReason?: string | null;
  onProcess: () => void;
}) {
  const t = useTranslations("publicTools");

  return (
    <div className="flex flex-col gap-4">
      {state.error !== null ? (
        <Alert variant="destructive">
          <AlertTitle>{t("errors.title")}</AlertTitle>
          <AlertDescription>
            <p>{t(`errors.${state.error.key}`)}</p>
            {state.error.key === "signInRequired" ? (
              <p className="mt-2">
                <Link
                  href={loginPath(toolRoute)}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {t("errors.signInCta")}
                </Link>
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {disabledReason !== null &&
      disabledReason !== undefined &&
      !canProcess &&
      state.error === null ? (
        <p className="text-sm text-muted-foreground">{disabledReason}</p>
      ) : null}

      <div className="hidden md:block">
        <Button
          type="button"
          size="lg"
          disabled={!canProcess}
          onClick={onProcess}
        >
          {processLabel}
        </Button>
      </div>
    </div>
  );
}
