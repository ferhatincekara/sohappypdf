"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { loginPath } from "@/features/auth/paths";
import { resolveProHref } from "@/features/marketing/lib/marketing-cta";
import { authClient } from "@/lib/auth/auth-client";
import { Link } from "@/lib/i18n/navigation";
import { PUBLIC_ANONYMOUS_RETENTION_HOURS } from "../lib/anonymous-limits";
import { isPlanUpgradeToolError } from "../lib/public-tool-errors";
import { isFileWorkspaceUx, type ToolUxState } from "../types/tool-ux-state";

const MOBILE_BAR_CLASS =
  "fixed inset-x-3 bottom-3 z-30 rounded-lg border border-border bg-background/95 p-3 shadow-lift backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden";

function MobileActionBarFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <div className={MOBILE_BAR_CLASS}>{children}</div>
    </>
  );
}

export function ToolMobileActionBar({
  ux,
  toolRoute,
  canProcess,
  processLabel,
  processHint,
  isDownloading,
  downloadLabel,
  resetLabel,
  maxFiles,
  maxFileSizeBytes,
  awaitingSignIn = false,
  autoProcess = false,
  onProcess,
  onDownload,
  onRetry,
  onReset,
}: {
  ux: ToolUxState;
  toolRoute: `/${string}`;
  canProcess: boolean;
  processLabel: string;
  processHint?: string | null;
  isDownloading: boolean;
  downloadLabel?: string;
  resetLabel?: string;
  maxFiles: number;
  maxFileSizeBytes: number;
  awaitingSignIn?: boolean;
  autoProcess?: boolean;
  onProcess: () => void;
  onDownload: () => void;
  onRetry: () => void;
  onReset: () => void;
}) {
  const t = useTranslations("publicTools");
  const session = authClient.useSession();
  const isAuthenticated = session.data !== null && session.data !== undefined;

  if (ux.status === "empty" || ux.status === "processing") {
    return null;
  }

  if (isFileWorkspaceUx(ux)) {
    const needsSignIn = awaitingSignIn || ux.error?.key === "signInRequired";
    const showUpgrade =
      ux.error !== null && isPlanUpgradeToolError(ux.error.key);

    if (autoProcess && !needsSignIn && !showUpgrade) {
      return null;
    }

    return (
      <MobileActionBarFrame>
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {needsSignIn
                ? t("errors.signInRequired")
                : ux.error?.key === "tooManyPages"
                  ? t("errors.tooManyPagesHint")
                  : ux.error?.key === "upgradeRequired"
                    ? t("errors.upgradeRequired")
                    : (processHint ??
                      t("limits", {
                        files: maxFiles,
                        sizeMb: Math.floor(maxFileSizeBytes / (1024 * 1024)),
                        hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
                      }))}
            </p>
          </div>
          {needsSignIn ? (
            <Button
              nativeButton={false}
              size="lg"
              className="min-h-12 shrink-0 px-5"
              render={<Link href={loginPath(toolRoute)} />}
            >
              {t("errors.signInCta")}
            </Button>
          ) : showUpgrade ? (
            <Button
              nativeButton={false}
              size="lg"
              className="min-h-12 shrink-0 px-5"
              render={<Link href={resolveProHref(isAuthenticated)} />}
            >
              {t("errors.upgradeCta")}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="min-h-12 shrink-0 px-5"
              disabled={!canProcess}
              onClick={onProcess}
            >
              {processLabel}
            </Button>
          )}
        </div>
      </MobileActionBarFrame>
    );
  }

  if (ux.status === "success") {
    return (
      <MobileActionBarFrame>
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          <Button
            type="button"
            size="lg"
            className="min-h-12 flex-1"
            disabled={isDownloading}
            onClick={onDownload}
          >
            {isDownloading
              ? t("result.downloading")
              : ux.outputs.length > 1
                ? t("result.downloadAll", { count: ux.outputs.length })
                : (downloadLabel ?? t("actions.download"))}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="min-h-12 flex-1"
            onClick={onReset}
          >
            {resetLabel ?? t("actions.startAgain")}
          </Button>
        </div>
      </MobileActionBarFrame>
    );
  }

  if (ux.status === "error") {
    const showUpgrade = isPlanUpgradeToolError(ux.error.key);

    return (
      <MobileActionBarFrame>
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          {ux.error.retryable ? (
            <Button
              type="button"
              size="lg"
              className="min-h-12 flex-1"
              onClick={onRetry}
            >
              {t("actions.retry")}
            </Button>
          ) : null}
          {showUpgrade ? (
            <Button
              nativeButton={false}
              size="lg"
              className="min-h-12 flex-1"
              render={<Link href={resolveProHref(isAuthenticated)} />}
            >
              {t("errors.upgradeCta")}
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            variant={ux.error.retryable || showUpgrade ? "outline" : "default"}
            className="min-h-12 flex-1"
            onClick={onReset}
          >
            {resetLabel ?? t("actions.startAgain")}
          </Button>
        </div>
      </MobileActionBarFrame>
    );
  }

  return (
    <MobileActionBarFrame>
      <div className="mx-auto flex w-full max-w-5xl">
        <Button
          type="button"
          size="lg"
          className="min-h-12 w-full"
          onClick={onReset}
        >
          {resetLabel ?? t("actions.startAgain")}
        </Button>
      </div>
    </MobileActionBarFrame>
  );
}
