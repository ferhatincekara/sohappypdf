"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkboxStoredValue,
  type DetectedFormField,
  isCheckboxChecked,
  readPdfFormFields,
} from "../../lib/pdf-form-fields";
import { usePdfDocument } from "../../pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";

type DetectionStatus = "idle" | "loading" | "ready" | "empty" | "error";

export function FillPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [fields, setFields] = useState<DetectedFormField[]>([]);
  const [skippedRadio, setSkippedRadio] = useState(0);
  const [skippedSignature, setSkippedSignature] = useState(0);
  const workspaceRef = useRef(props.workspaceState);
  workspaceRef.current = props.workspaceState;

  useEffect(() => {
    if (pdf.status === "loading" || pdf.status === "idle") {
      setStatus("loading");
      return;
    }

    if (pdf.status === "error" || pdf.document === null) {
      setStatus("error");
      setFields([]);
      return;
    }

    let cancelled = false;
    setStatus("loading");

    void readPdfFormFields(pdf.document).then((summary) => {
      if (cancelled) {
        return;
      }

      setFields(summary.fields);
      setSkippedRadio(summary.skippedRadio);
      setSkippedSignature(summary.skippedSignature);
      setStatus(summary.fields.length === 0 ? "empty" : "ready");

      const nextFields = { ...workspaceRef.current.formFields };
      let changed = false;

      for (const field of summary.fields) {
        if (nextFields[field.name] === undefined) {
          nextFields[field.name] = field.value;
          changed = true;
        }
      }

      if (changed) {
        props.setWorkspaceState({
          ...workspaceRef.current,
          formFields: nextFields,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdf.document, pdf.status, props.setWorkspaceState]);

  if (entry === undefined) {
    return null;
  }

  function setFieldValue(name: string, value: string): void {
    props.setWorkspaceState({
      ...workspaceRef.current,
      formFields: {
        ...workspaceRef.current.formFields,
        [name]: value,
      },
    });
  }

  const previewFailed =
    pdf.errorKey === "passwordProtected"
      ? t("workspaces.fill.passwordProtected")
      : t("workspaces.fill.previewFailed");

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

      <section className="flex flex-col gap-4" aria-labelledby="fill-heading">
        <div className="flex flex-col gap-1">
          <h2
            id="fill-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.fill.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.fill.hint")}
          </p>
        </div>

        {status === "loading" ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t("workspaces.fill.detecting")}
          </p>
        ) : null}

        {status === "error" ? (
          <p className="text-sm text-muted-foreground">{previewFailed}</p>
        ) : null}

        {status === "empty" ? (
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.fill.empty")}
          </p>
        ) : null}

        {status === "ready" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-foreground">
              {t("workspaces.fill.fieldCount", { count: fields.length })}
            </p>
            <ol className="flex flex-col gap-4">
              {fields.map((field) => {
                const value =
                  props.workspaceState.formFields[field.name] ?? field.value;
                const fieldId = `form-field-${field.name}`;

                return (
                  <li key={field.name} className="flex max-w-lg flex-col gap-2">
                    {field.kind === "checkbox" ? (
                      <label className="flex items-center gap-3 text-sm text-foreground">
                        <input
                          id={fieldId}
                          type="checkbox"
                          className="size-4 accent-foreground"
                          checked={isCheckboxChecked(value)}
                          disabled={props.disabled}
                          onChange={(event) => {
                            setFieldValue(
                              field.name,
                              checkboxStoredValue(event.target.checked),
                            );
                          }}
                        />
                        {field.label}
                      </label>
                    ) : (
                      <>
                        <Label htmlFor={fieldId}>{field.label}</Label>
                        {field.kind === "dropdown" &&
                        field.options.length > 0 ? (
                          <select
                            id={fieldId}
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            value={value}
                            disabled={props.disabled}
                            onChange={(event) => {
                              setFieldValue(field.name, event.target.value);
                            }}
                          >
                            {value.length === 0 ||
                            !field.options.includes(value) ? (
                              <option value={value}>
                                {value.length === 0
                                  ? t("workspaces.fill.choose")
                                  : value}
                              </option>
                            ) : null}
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            id={fieldId}
                            type={field.kind === "date" ? "date" : "text"}
                            value={value}
                            disabled={props.disabled}
                            onChange={(event) => {
                              setFieldValue(field.name, event.target.value);
                            }}
                          />
                        )}
                        <p className="text-xs text-muted-foreground">
                          {t("workspaces.fill.page", { page: field.page })}
                        </p>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
            <label className="flex max-w-lg items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-foreground"
                checked={props.workspaceState.flattenForm}
                disabled={props.disabled}
                onChange={(event) => {
                  props.setWorkspaceState({
                    ...workspaceRef.current,
                    flattenForm: event.target.checked,
                  });
                }}
              />
              <span>
                <span className="font-medium">
                  {t("workspaces.fill.flatten")}
                </span>
                <span className="mt-1 block text-muted-foreground text-pretty">
                  {t("workspaces.fill.flattenHint")}
                </span>
              </span>
            </label>
          </div>
        ) : null}

        {skippedRadio > 0 ? (
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.fill.skippedRadio")}
          </p>
        ) : null}
        {skippedSignature > 0 ? (
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.fill.skippedSignature")}
          </p>
        ) : null}
      </section>

      <p className="text-sm font-medium text-foreground">
        {status === "ready"
          ? t("workspaces.fill.output")
          : t("workspaces.fill.selectPrompt")}
      </p>

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={props.canProcess}
        processLabel={props.processLabel}
        disabledReason={
          status === "ready" ? null : t("workspaces.fill.selectPrompt")
        }
        onProcess={props.onProcess}
      />
    </div>
  );
}
