export const COMPRESSION_LEVELS = ["low", "medium", "high"] as const;
export type CompressionLevel = (typeof COMPRESSION_LEVELS)[number];

export const ROTATION_DEGREES = [90, 180, 270] as const;
export type RotationDegrees = (typeof ROTATION_DEGREES)[number];

export type ToolWorkspaceState = {
  compressionLevel: CompressionLevel;
  rotationDegrees: RotationDegrees;
  splitRanges: string;
  pageOrder: string;
  pageRotations: string;
  pageSelection: string;
  pagesToRemove: string;
  cropMargins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  watermarkText: string;
  pageNumberStart: number;
  password: string;
  targetLanguage: string;
  outputFormat: string;
};

export const DEFAULT_TOOL_WORKSPACE_STATE: ToolWorkspaceState = {
  compressionLevel: "medium",
  rotationDegrees: 90,
  splitRanges: "",
  pageOrder: "",
  pageRotations: "",
  pageSelection: "",
  pagesToRemove: "",
  cropMargins: {
    top: 36,
    right: 36,
    bottom: 36,
    left: 36,
  },
  watermarkText: "CONFIDENTIAL",
  pageNumberStart: 1,
  password: "",
  targetLanguage: "eng",
  outputFormat: "",
};

export function parsePageListInput(value: string): number[] | undefined {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parts = trimmed.split(/[,\s]+/).filter((part) => part.length > 0);
  const pages: number[] = [];

  for (const part of parts) {
    const parsed = Number.parseInt(part, 10);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return undefined;
    }

    if (pages.includes(parsed)) {
      return undefined;
    }

    pages.push(parsed);
  }

  return pages.length === 0 ? undefined : pages;
}

export function parseOrganizeOrderInput(value: string): number[] | undefined {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parts = trimmed.split(/[,\s]+/).filter((part) => part.length > 0);
  const pages: number[] = [];

  for (const part of parts) {
    const parsed = Number.parseInt(part, 10);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return undefined;
    }

    pages.push(parsed);
  }

  return pages.length === 0 ? undefined : pages;
}

export function parseOrganizeRotationsInput(
  value: string,
  orderLength: number,
): Array<0 | 90 | 180 | 270> | undefined {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parts = trimmed.split(/[,\s]+/).filter((part) => part.length > 0);

  if (parts.length !== orderLength) {
    return undefined;
  }

  const rotations: Array<0 | 90 | 180 | 270> = [];

  for (const part of parts) {
    const parsed = Number.parseInt(part, 10);

    if (parsed !== 0 && parsed !== 90 && parsed !== 180 && parsed !== 270) {
      return undefined;
    }

    rotations.push(parsed);
  }

  return rotations;
}

export function parseSplitRangesInput(
  value: string,
): Array<{ start: number; end: number }> | undefined {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const ranges: Array<{ start: number; end: number }> = [];

  for (const segment of trimmed.split(",")) {
    const part = segment.trim();

    if (part.length === 0) {
      continue;
    }

    const match = /^(\d+)\s*-\s*(\d+)$/.exec(part);

    if (match === null) {
      const single = Number.parseInt(part, 10);

      if (!Number.isInteger(single) || single < 1) {
        return undefined;
      }

      ranges.push({ start: single, end: single });
      continue;
    }

    const start = Number.parseInt(match[1] ?? "", 10);
    const end = Number.parseInt(match[2] ?? "", 10);

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end < start
    ) {
      return undefined;
    }

    ranges.push({ start, end });
  }

  return ranges.length === 0 ? undefined : ranges;
}

export function parseSelectedPagesInput(value: string): number[] | undefined {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return [];
  }

  const ranges = parseSplitRangesInput(trimmed);

  if (ranges === undefined) {
    return undefined;
  }

  const pages: number[] = [];

  for (const range of ranges) {
    for (let page = range.start; page <= range.end; page += 1) {
      if (!pages.includes(page)) {
        pages.push(page);
      }
    }
  }

  return pages.sort((left, right) => left - right);
}

export function buildToolConversionOptions(
  toolId: string,
  state: ToolWorkspaceState,
): Record<string, unknown> | undefined {
  switch (toolId) {
    case "compress-pdf":
      return { level: state.compressionLevel };
    case "rotate-pdf": {
      const pages = parseSelectedPagesInput(state.pageSelection);

      if (pages === undefined || pages.length === 0) {
        return undefined;
      }

      return { degrees: state.rotationDegrees, pages };
    }
    case "split-pdf": {
      const ranges = parseSplitRangesInput(state.splitRanges);
      return ranges === undefined ? undefined : { ranges };
    }
    case "organize-pdf": {
      const order = parseOrganizeOrderInput(state.pageOrder);

      if (order === undefined) {
        return undefined;
      }

      if (state.pageRotations.trim().length === 0) {
        return { order };
      }

      const rotations = parseOrganizeRotationsInput(
        state.pageRotations,
        order.length,
      );

      if (rotations === undefined) {
        return undefined;
      }

      if (rotations.every((rotation) => rotation === 0)) {
        return { order };
      }

      return { order, rotations };
    }
    case "reorder-pages": {
      const order = parsePageListInput(state.pageOrder);
      return order === undefined ? undefined : { order };
    }
    case "remove-pages": {
      const pages = parsePageListInput(state.pagesToRemove);
      return pages === undefined ? undefined : { pages };
    }
    case "crop-pdf":
      return {
        marginTop: state.cropMargins.top,
        marginRight: state.cropMargins.right,
        marginBottom: state.cropMargins.bottom,
        marginLeft: state.cropMargins.left,
      };
    case "watermark-pdf":
      return state.watermarkText.trim().length === 0
        ? undefined
        : { text: state.watermarkText.trim() };
    case "page-numbers-pdf":
      return { startAt: state.pageNumberStart };
    case "protect-pdf":
    case "unlock-pdf":
      return state.password.trim().length === 0
        ? undefined
        : { password: state.password };
    case "ai-summarizer":
      return {
        language: "eng",
        ...(state.outputFormat === "md" ? { outputMode: "md" } : {}),
      };
    case "translate-pdf":
      return state.targetLanguage.trim().length === 0
        ? undefined
        : { targetLanguage: state.targetLanguage.trim() };
    default:
      return undefined;
  }
}
