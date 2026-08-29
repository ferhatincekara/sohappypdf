"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolSelectedActions } from "@/features/public-tools/components/tool-selected-actions";
import { ToolWorkspaceFiles } from "@/features/public-tools/components/tool-workspace-files";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

const MAX_PASSWORD_LENGTH = 128;

function protectDisabledReason(
  t: ReturnType<typeof useTranslations>,
  password: string,
  confirmPassword: string,
): string | null {
  if (password.length === 0) {
    return t("workspaces.protect.required");
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return t("workspaces.protect.tooLong");
  }

  if (confirmPassword.length === 0) {
    return t("workspaces.protect.confirmRequired");
  }

  if (password !== confirmPassword) {
    return t("workspaces.protect.mismatch");
  }

  return null;
}

export function ProtectPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const password = props.workspaceState.password;
  const confirmPassword = props.workspaceState.confirmPassword;
  const disabledReason = protectDisabledReason(t, password, confirmPassword);

  if (entry === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolWorkspaceFiles props={props} />
      <section
        className="flex max-w-md flex-col gap-4"
        aria-labelledby="protect-heading"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="protect-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.protect.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.protect.hint")}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="protect-password">
            {t("workspaces.protect.password")}
          </Label>
          <Input
            id="protect-password"
            type="password"
            autoComplete="new-password"
            maxLength={MAX_PASSWORD_LENGTH}
            value={password}
            disabled={props.disabled}
            aria-invalid={
              password.length > 0 && disabledReason !== null ? true : undefined
            }
            onChange={(event) => {
              props.setWorkspaceState({
                ...props.workspaceState,
                password: event.target.value,
              });
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="protect-password-confirm">
            {t("workspaces.protect.confirm")}
          </Label>
          <Input
            id="protect-password-confirm"
            type="password"
            autoComplete="new-password"
            maxLength={MAX_PASSWORD_LENGTH}
            value={confirmPassword}
            disabled={props.disabled}
            aria-invalid={
              confirmPassword.length > 0 && password !== confirmPassword
                ? true
                : undefined
            }
            onChange={(event) => {
              props.setWorkspaceState({
                ...props.workspaceState,
                confirmPassword: event.target.value,
              });
            }}
          />
        </div>
      </section>
      <p className="text-sm font-medium text-foreground">
        {t("workspaces.protect.output")}
      </p>
      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        disabledReason={disabledReason}
        onProcess={props.onProcess}
      />
    </div>
  );
}
