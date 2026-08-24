"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";

const MAX_PASSWORD_LENGTH = 128;

export function UnlockPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const password = props.workspaceState.password;
  const disabledReason =
    password.trim().length === 0 ? t("workspaces.unlock.required") : null;

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
      <section
        className="flex max-w-md flex-col gap-4"
        aria-labelledby="unlock-heading"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="unlock-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.unlock.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.unlock.hint")}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="unlock-password">
            {t("workspaces.unlock.password")}
          </Label>
          <Input
            id="unlock-password"
            type="password"
            autoComplete="current-password"
            maxLength={MAX_PASSWORD_LENGTH}
            value={password}
            disabled={props.disabled}
            onChange={(event) => {
              props.setWorkspaceState({
                ...props.workspaceState,
                password: event.target.value,
              });
            }}
          />
        </div>
      </section>
      <p className="text-sm font-medium text-foreground">
        {t("workspaces.unlock.output")}
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
