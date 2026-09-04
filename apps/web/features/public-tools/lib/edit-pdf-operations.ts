import {
  type EditorObject,
  type EditorTextObject,
  editorRectToPdf,
} from "@/features/pdf-document-editor";

export const MAX_EDIT_OPERATIONS = 400;

export type ToolEditFont =
  | "helvetica"
  | "helveticaBold"
  | "times"
  | "timesBold"
  | "courier"
  | "courierBold";

export type ToolEditOperation =
  | {
      kind: "text";
      page: number;
      x: number;
      y: number;
      text: string;
      size: number;
      color?: string;
      font?: ToolEditFont;
    }
  | {
      kind: "erase";
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      kind: "rectangle";
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      style: "fill" | "highlight";
    }
  | {
      kind: "image";
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    };

function resolveEditFont(family: string | undefined): ToolEditFont {
  const compact = (family ?? "").replace(/[\s_+-]+/g, "").toLowerCase();
  const bold = /bold|black|heavy/.test(compact);

  if (/times|serif/.test(compact)) {
    return bold ? "timesBold" : "times";
  }

  if (/courier|mono/.test(compact)) {
    return bold ? "courierBold" : "courier";
  }

  return bold ? "helveticaBold" : "helvetica";
}

function roundedBox(box: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.max(0, Math.round(box.x)),
    y: Math.max(0, Math.round(box.y)),
    width: Math.max(1, Math.round(box.width)),
    height: Math.max(1, Math.round(box.height)),
  };
}

function originChanged(object: EditorTextObject): boolean {
  const origin = object.origin;

  if (origin === undefined) {
    return true;
  }

  return (
    object.text.trim() !== origin.text.trim() ||
    Math.round(object.x) !== Math.round(origin.x) ||
    Math.round(object.y) !== Math.round(origin.y) ||
    Math.round(object.fontSize) !== Math.round(origin.fontSize)
  );
}

function expandBox(
  box: { x: number; y: number; width: number; height: number },
  pad: number,
): { x: number; y: number; width: number; height: number } {
  return {
    x: box.x - pad,
    y: box.y - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
}

export function editorObjectsToEditOperations(
  objects: readonly EditorObject[],
  pageHeights: Readonly<Record<string, number>>,
  originals: readonly EditorTextObject[] = [],
): ToolEditOperation[] | undefined {
  const operations: ToolEditOperation[] = [];
  const currentById = new Map(
    objects
      .filter((object) => object.kind === "text")
      .map((object) => [object.id, object]),
  );

  for (const original of originals) {
    const pageHeight = pageHeights[String(original.page)];
    if (pageHeight === undefined || pageHeight <= 0) {
      return undefined;
    }

    const current = currentById.get(original.id);
    const origin = original.origin ?? original;

    if (current === undefined || originChanged(current)) {
      const cover = editorRectToPdf({
        ...expandBox(origin, 2),
        pageHeight,
      });
      operations.push({
        kind: "erase",
        page: original.page,
        ...roundedBox(cover),
      });
    }
  }

  for (const object of objects) {
    if (object.kind === "signature") {
      continue;
    }

    const pageHeight = pageHeights[String(object.page)];
    if (pageHeight === undefined || pageHeight <= 0) {
      return undefined;
    }

    const box = editorRectToPdf({
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      pageHeight,
    });

    if (object.kind === "text") {
      const text = object.text.trim();
      if (text.length === 0) {
        continue;
      }

      if (object.source === "original" && !originChanged(object)) {
        continue;
      }

      operations.push({
        kind: "text",
        page: object.page,
        x: box.x,
        y: box.y,
        text: text.slice(0, 500),
        size: Math.min(96, Math.max(8, Math.round(object.fontSize))),
        font: resolveEditFont(object.fontFamily),
        ...(object.color === undefined ? {} : { color: object.color }),
      });
      continue;
    }

    if (object.kind === "rectangle") {
      if (box.width <= 0 || box.height <= 0) {
        continue;
      }

      operations.push({
        kind: "rectangle",
        page: object.page,
        ...box,
        style: object.style,
      });
      continue;
    }

    if (object.kind === "image") {
      if (box.width <= 0 || box.height <= 0) {
        continue;
      }

      operations.push({
        kind: "image",
        page: object.page,
        ...box,
      });
    }
  }

  if (operations.length === 0 || operations.length > MAX_EDIT_OPERATIONS) {
    return undefined;
  }

  return operations;
}
