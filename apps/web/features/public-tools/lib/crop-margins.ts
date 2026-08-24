export type CropEdge = "top" | "right" | "bottom" | "left";

export type CropMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const MIN_CROP_SIZE = 24;
const MAX_MARGIN = 500;

export function clampCropMargins(
  margins: CropMargins,
  pageWidth: number,
  pageHeight: number,
): CropMargins {
  const maxLeft = Math.max(0, pageWidth - MIN_CROP_SIZE);
  const maxBottom = Math.max(0, pageHeight - MIN_CROP_SIZE);
  const left = clampMargin(margins.left, maxLeft);
  const bottom = clampMargin(margins.bottom, maxBottom);
  const maxRight = Math.max(0, pageWidth - left - MIN_CROP_SIZE);
  const maxTop = Math.max(0, pageHeight - bottom - MIN_CROP_SIZE);

  return {
    left,
    bottom,
    right: clampMargin(margins.right, maxRight),
    top: clampMargin(margins.top, maxTop),
  };
}

export function moveCropMargins(
  margins: CropMargins,
  dx: number,
  dy: number,
  pageWidth: number,
  pageHeight: number,
): CropMargins {
  return clampCropMargins(
    {
      top: margins.top + dy,
      right: margins.right - dx,
      bottom: margins.bottom - dy,
      left: margins.left + dx,
    },
    pageWidth,
    pageHeight,
  );
}

export function resizeCropEdge(
  margins: CropMargins,
  edge: CropEdge,
  delta: number,
  pageWidth: number,
  pageHeight: number,
): CropMargins {
  const next = { ...margins };

  if (edge === "top") {
    next.top += delta;
  } else if (edge === "right") {
    next.right += delta;
  } else if (edge === "bottom") {
    next.bottom += delta;
  } else {
    next.left += delta;
  }

  return clampCropMargins(next, pageWidth, pageHeight);
}

function clampMargin(value: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(MAX_MARGIN, maximum, Math.max(0, value));
}
