"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { loginPath } from "@/features/auth/paths";
import { ToolUpgradeCard } from "@/features/public-tools/components/tool-upgrade-card";
import { isPlanUpgradeToolError } from "@/features/public-tools/lib/public-tool-errors";
import type { ToolSelectedUxState } from "@/features/public-tools/types/tool-ux-state";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export function ToolSelectedActions({
  toolRoute,
  state,
  canProcess,
  processLabel,
  disabledReason,
  awaitingSignIn = false,
  autoProcess = false,
  fullWidth = false,
  onProcess,
}: {
  toolRoute: `/${string}`;
  state: ToolSelectedUxState;
  canProcess: boolean;
  processLabel: string;
  disabledReason?: string | null;
  awaitingSignIn?: boolean;
  autoProcess?: boolean;
  fullWidth?: boolean;
  onProcess: () => void;
}) {
  const t = useTranslations("publicTools");
  const needsSignIn = awaitingSignIn || state.error?.key === "signInRequired";
  const upgradeErrorKey =
    state.error !== null && isPlanUpgradeToolError(state.error.key)
      ? state.error.key
      : null;

  return (
    <div className="flex flex-col gap-4">
      {upgradeErrorKey === null ? null : (
        <ToolUpgradeCard errorKey={upgradeErrorKey} />
      )}

      {disabledReason !== null &&
      disabledReason !== undefined &&
      !canProcess &&
      state.error === null &&
      !autoProcess ? (
        <p className="text-sm text-muted-foreground">{disabledReason}</p>
      ) : null}

      {autoProcess && !needsSignIn && state.error === null ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {canProcess ? t("autoStart.starting") : t("autoStart.hint")}
        </p>
      ) : null}

      <div className={cn("hidden md:block", fullWidth && "w-full")}>
        {needsSignIn ? (
          <Button
            nativeButton={false}
            size="lg"
            className={fullWidth ? "w-full" : undefined}
            render={<Link href={loginPath(toolRoute)} />}
          >
            {t("errors.signInCta")}
          </Button>
        ) : autoProcess || upgradeErrorKey !== null ? null : (
          <Button
            type="button"
            size="lg"
            className={fullWidth ? "w-full" : undefined}
            disabled={!canProcess}
            onClick={onProcess}
          >
            {processLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
