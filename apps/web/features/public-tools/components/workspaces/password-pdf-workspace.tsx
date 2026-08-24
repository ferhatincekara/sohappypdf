"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";

export function PasswordPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const isUnlock = props.tool.id === "unlock-pdf";

  if (entry === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolFileCard
        entry={entry}
        accept={props.accept}
        disabled={props.disabled}
        onRemove={() => {
          props.onRemove(entry.id);
        }}
        onReplace={props.onReplaceFiles}
        onRetry={() => {
          props.onRetryUpload(entry.id);
        }}
      />
      <section className="flex max-w-md flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {isUnlock
              ? t("workspaces.password.unlockTitle")
              : t("workspaces.password.protectTitle")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {isUnlock
              ? t("workspaces.password.unlockHint")
              : t("workspaces.password.protectHint")}
          </p>
        </div>
        <Label htmlFor="tool-password">{t("options.password")}</Label>
        <Input
          id="tool-password"
          type="password"
          autoComplete="new-password"
          value={props.workspaceState.password}
          disabled={props.disabled}
          onChange={(event) => {
            props.setWorkspaceState({
              ...props.workspaceState,
              password: event.target.value,
            });
          }}
        />
      </section>
      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        disabledReason={
          props.workspaceState.password.trim().length === 0
            ? t("workspaces.password.required")
            : null
        }
        onProcess={props.onProcess}
      />
    </div>
  );
}
