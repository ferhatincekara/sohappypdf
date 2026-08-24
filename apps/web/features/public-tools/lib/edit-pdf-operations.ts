import {
  type EditorObject,
  editorRectToPdf,
} from "@/features/pdf-document-editor";

export const MAX_EDIT_OPERATIONS = 50;

export type ToolEditOperation =
  | {
      kind: "text";
      page: number;
      x: number;
      y: number;
      text: string;
      size: number;
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

export function editorObjectsToEditOperations(
  objects: readonly EditorObject[],
  pageHeights: Readonly<Record<string, number>>,
): ToolEditOperation[] | undefined {
  const operations: ToolEditOperation[] = [];

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

      operations.push({
        kind: "text",
        page: object.page,
        x: box.x,
        y: box.y,
        text: text.slice(0, 500),
        size: Math.min(96, Math.max(8, Math.round(object.fontSize))),
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
