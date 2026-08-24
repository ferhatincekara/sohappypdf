"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditorObject } from "../types/editor-object";

export function EditorPropertiesPanel({
  object,
  disabled,
  onChange,
}: {
  object: EditorObject | null;
  disabled: boolean;
  onChange: (object: EditorObject) => void;
}) {
  const t = useTranslations("publicTools.editor");

  if (object === null) {
    return (
      <aside className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-foreground">
          {t("properties")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("propertiesEmpty")}
        </p>
      </aside>
    );
  }

  const selected = object;

  function setNumber(
    key: "x" | "y" | "width" | "height" | "rotation",
    value: string,
  ): void {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    onChange({ ...selected, [key]: parsed });
  }

  return (
    <aside className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">{t("properties")}</h2>
      <p className="text-xs text-muted-foreground">
        {t(`objects.${object.kind}`)}
      </p>
      {object.kind === "text" || object.kind === "signature" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="editor-object-text">{t("text")}</Label>
          <Input
            id="editor-object-text"
            value={object.text ?? ""}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...object, text: event.target.value });
            }}
          />
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        {(object.kind === "signature"
          ? (["x", "y", "width", "height"] as const)
          : (["x", "y", "width", "height", "rotation"] as const)
        ).map((key) => (
          <div key={key} className="flex flex-col gap-2">
            <Label htmlFor={`editor-object-${key}`}>{t(key)}</Label>
            <Input
              id={`editor-object-${key}`}
              type="number"
              value={Math.round(object[key])}
              disabled={disabled}
              onChange={(event) => {
                setNumber(key, event.target.value);
              }}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
