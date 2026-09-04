import {
  type EditorObject,
  editorRectToPdf,
} from "@/features/pdf-document-editor";

export const MAX_REDACT_REGIONS = 80;

export type ToolRedactRegion = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function editorObjectsToRedactRegions(
  objects: readonly EditorObject[],
  pageHeights: Readonly<Record<string, number>>,
): ToolRedactRegion[] | undefined {
  const regions: ToolRedactRegion[] = [];

  for (const object of objects) {
    if (object.kind !== "rectangle") {
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

    if (box.width <= 0 || box.height <= 0) {
      continue;
    }

    regions.push({
      page: object.page,
      ...box,
    });
  }

  if (regions.length === 0 || regions.length > MAX_REDACT_REGIONS) {
    return undefined;
  }

  return regions;
}
