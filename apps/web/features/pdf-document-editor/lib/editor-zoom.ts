import {
  DEFAULT_EDITOR_ZOOM,
  MAX_EDITOR_ZOOM,
  MIN_EDITOR_ZOOM,
} from "@/features/pdf-document-editor/lib/document-editor-state";

export type EditorFitMode = "width" | "page";

const GUTTER = 48;

function clampZoom(zoom: number): number {
  return Math.min(MAX_EDITOR_ZOOM, Math.max(MIN_EDITOR_ZOOM, zoom));
}

export function zoomToFitWidth(
  pageWidth: number,
  viewportWidth: number,
): number {
  if (pageWidth <= 0 || viewportWidth <= 0) {
    return DEFAULT_EDITOR_ZOOM;
  }

  return clampZoom((viewportWidth - GUTTER) / pageWidth);
}

export function zoomToFitPage(
  pageWidth: number,
  pageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  if (
    pageWidth <= 0 ||
    pageHeight <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return DEFAULT_EDITOR_ZOOM;
  }

  const widthZoom = (viewportWidth - GUTTER) / pageWidth;
  const heightZoom = (viewportHeight - GUTTER) / pageHeight;
  return clampZoom(Math.min(widthZoom, heightZoom));
}
