"use client";

import type { ToolDefinition } from "@repo/tools/catalog";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CompressionLevel,
  ToolWorkspaceState,
} from "../lib/tool-workspace";

export function toolHasWorkspaceOptions(toolId: string): boolean {
  switch (toolId) {
    case "reorder-pages":
    case "page-numbers-pdf":
      return true;
    default:
      return false;
  }
}

export function ToolOptionsPanel({
  tool,
  state,
  onChange,
  disabled,
}: {
  tool: ToolDefinition;
  state: ToolWorkspaceState;
  onChange: (next: ToolWorkspaceState) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("publicTools.options");

  switch (tool.id) {
    case "compress-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="compression-level">{t("compressionLevel")}</Label>
          <Select
            value={state.compressionLevel}
            disabled={disabled}
            items={[
              { value: "low", label: t("compressionLow") },
              { value: "medium", label: t("compressionMedium") },
              { value: "high", label: t("compressionHigh") },
            ]}
            onValueChange={(value) => {
              if (value === null) {
                return;
              }

              onChange({
                ...state,
                compressionLevel: value as CompressionLevel,
              });
            }}
          >
            <SelectTrigger id="compression-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t("compressionLow")}</SelectItem>
              <SelectItem value="medium">{t("compressionMedium")}</SelectItem>
              <SelectItem value="high">{t("compressionHigh")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    case "reorder-pages":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="page-order">{t("pageOrder")}</Label>
          <Input
            id="page-order"
            placeholder={t("pageOrderPlaceholder")}
            value={state.pageOrder}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...state, pageOrder: event.target.value });
            }}
          />
        </div>
      );
    case "page-numbers-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="page-start">{t("pageNumberStart")}</Label>
          <Input
            id="page-start"
            type="number"
            min={1}
            value={state.pageNumberStart}
            disabled={disabled}
            onChange={(event) => {
              onChange({
                ...state,
                pageNumberStart: Number(event.target.value),
              });
            }}
          />
        </div>
      );
    case "protect-pdf":
    case "unlock-pdf":
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={state.password}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...state, password: event.target.value });
            }}
          />
        </div>
      );
    default:
      return null;
  }
}
