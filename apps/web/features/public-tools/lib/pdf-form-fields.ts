import type { PdfjsDocument } from "./pdfjs-client";

export const FILLABLE_FORM_FIELD_KINDS = [
  "text",
  "date",
  "checkbox",
  "dropdown",
] as const;

export type FillableFormFieldKind = (typeof FILLABLE_FORM_FIELD_KINDS)[number];

export type DetectedFormFieldKind =
  | FillableFormFieldKind
  | "radio"
  | "signature"
  | "unsupported";

export type DetectedFormField = {
  name: string;
  kind: FillableFormFieldKind;
  label: string;
  value: string;
  options: readonly string[];
  page: number;
};

export type PdfFormFieldSummary = {
  fields: DetectedFormField[];
  skippedRadio: number;
  skippedSignature: number;
};

const MAX_FORM_FIELDS = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return "";
}

export function isCheckboxChecked(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

export function checkboxStoredValue(checked: boolean): string {
  return checked ? "true" : "false";
}

export function classifyFormWidget(
  annotation: Record<string, unknown>,
): DetectedFormFieldKind {
  if (annotation.radioButton === true) {
    return "radio";
  }

  if (annotation.checkBox === true) {
    return "checkbox";
  }

  const fieldType = String(annotation.fieldType ?? annotation.type ?? "");

  if (fieldType === "Sig" || fieldType === "signature") {
    return "signature";
  }

  if (
    fieldType === "Ch" ||
    fieldType === "combobox" ||
    fieldType === "listbox" ||
    annotation.combo === true
  ) {
    return "dropdown";
  }

  if (fieldType === "checkbox") {
    return "checkbox";
  }

  if (fieldType === "radiobutton") {
    return "radio";
  }

  if (fieldType === "Tx" || fieldType === "text") {
    const contentType = String(annotation.textContentType ?? "").toLowerCase();
    if (contentType.includes("date")) {
      return "date";
    }

    return "text";
  }

  return "unsupported";
}

function dropdownOptions(annotation: Record<string, unknown>): string[] {
  if (!Array.isArray(annotation.options)) {
    return [];
  }

  const options: string[] = [];

  for (const item of annotation.options) {
    if (
      typeof item === "string" &&
      item.length > 0 &&
      !options.includes(item)
    ) {
      options.push(item);
      continue;
    }

    if (!isRecord(item)) {
      continue;
    }

    const exportValue = stringValue(item.exportValue);
    const displayValue = stringValue(item.displayValue);
    const value = exportValue.length > 0 ? exportValue : displayValue;

    if (value.length > 0 && !options.includes(value)) {
      options.push(value);
    }
  }

  return options;
}

function fieldValueForKind(
  annotation: Record<string, unknown>,
  kind: FillableFormFieldKind,
): string {
  const raw = stringValue(annotation.fieldValue ?? annotation.value);

  if (kind === "checkbox") {
    if (raw.length === 0 || raw.toLowerCase() === "off") {
      return checkboxStoredValue(false);
    }

    return checkboxStoredValue(true);
  }

  return raw.slice(0, 2_000);
}

function mergeField(
  current: DetectedFormField | undefined,
  next: DetectedFormField,
): DetectedFormField {
  if (current === undefined) {
    return next;
  }

  const options = [...current.options];
  for (const option of next.options) {
    if (!options.includes(option)) {
      options.push(option);
    }
  }

  return {
    ...current,
    options,
    page: Math.min(current.page, next.page),
    label: current.label.length > 0 ? current.label : next.label,
    value: current.value.length > 0 ? current.value : next.value,
  };
}

export async function readPdfFormFields(
  document: PdfjsDocument,
): Promise<PdfFormFieldSummary> {
  const byName = new Map<string, DetectedFormField>();
  const skippedNames = new Map<string, DetectedFormFieldKind>();
  let skippedRadio = 0;
  let skippedSignature = 0;

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const annotations = (await page.getAnnotations()) as unknown[];

    for (const annotation of annotations) {
      if (!isRecord(annotation)) {
        continue;
      }

      const name = stringValue(annotation.fieldName).trim();
      if (name.length === 0) {
        continue;
      }

      const kind = classifyFormWidget(annotation);

      if (kind === "radio") {
        if (!skippedNames.has(name)) {
          skippedNames.set(name, kind);
          skippedRadio += 1;
        }
        byName.delete(name);
        continue;
      }

      if (kind === "signature") {
        if (!skippedNames.has(name)) {
          skippedNames.set(name, kind);
          skippedSignature += 1;
        }
        byName.delete(name);
        continue;
      }

      if (kind === "unsupported" || skippedNames.has(name)) {
        continue;
      }

      const label =
        stringValue(annotation.alternativeText).trim() ||
        stringValue(annotation.fieldName);

      byName.set(
        name,
        mergeField(byName.get(name), {
          name,
          kind,
          label,
          value: fieldValueForKind(annotation, kind),
          options: dropdownOptions(annotation),
          page: pageNumber,
        }),
      );
    }
  }

  if (byName.size === 0) {
    const fieldObjects = await document.getFieldObjects();

    if (fieldObjects !== null) {
      for (const [name, widgets] of Object.entries(fieldObjects)) {
        if (name.trim().length === 0 || skippedNames.has(name)) {
          continue;
        }

        const first = Array.isArray(widgets) ? widgets[0] : undefined;
        if (!isRecord(first)) {
          continue;
        }

        const kind = classifyFormWidget(first);

        if (kind === "radio") {
          skippedRadio += 1;
          continue;
        }

        if (kind === "signature") {
          skippedSignature += 1;
          continue;
        }

        if (kind === "unsupported") {
          continue;
        }

        byName.set(name, {
          name,
          kind,
          label: name,
          value: fieldValueForKind(first, kind),
          options: dropdownOptions(first),
          page: 1,
        });
      }
    }
  }

  return {
    fields: [...byName.values()]
      .sort(
        (left, right) =>
          left.page - right.page || left.name.localeCompare(right.name),
      )
      .slice(0, MAX_FORM_FIELDS),
    skippedRadio,
    skippedSignature,
  };
}
