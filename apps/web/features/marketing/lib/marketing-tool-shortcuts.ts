import type { ToolDefinition } from "@repo/tools/catalog";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import {
  getMarketingToolNavGroups,
  getMarketingToolNavItems,
} from "@/features/marketing/lib/marketing-tools";

export const MARKETING_TOOL_SHORTCUT_LABEL_IDS = [
  "merge",
  "split",
  "compress",
  "convert",
  "ocr",
  "protect",
] as const;

export type MarketingToolShortcutLabelId =
  (typeof MARKETING_TOOL_SHORTCUT_LABEL_IDS)[number];

export type MarketingToolShortcut = {
  id: MarketingToolShortcutLabelId;
  href: string;
};

const SHORTCUT_TOOLS = {
  merge: "merge-pdf",
  split: "split-pdf",
  compress: "compress-pdf",
  ocr: "ocr-pdf",
  protect: "protect-pdf",
} as const;

export function getMarketingToolShortcuts(): readonly MarketingToolShortcut[] {
  const tools = new Map(
    getMarketingToolNavItems().map((item) => [item.id, item]),
  );
  const hasConvert = getMarketingToolNavGroups().some(
    (group) => group.category === "convert",
  );
  const shortcuts: MarketingToolShortcut[] = [];

  const merge = tools.get(SHORTCUT_TOOLS.merge);
  if (merge !== undefined) {
    shortcuts.push({ id: "merge", href: merge.href });
  }

  const split = tools.get(SHORTCUT_TOOLS.split);
  if (split !== undefined) {
    shortcuts.push({ id: "split", href: split.href });
  }

  const compress = tools.get(SHORTCUT_TOOLS.compress);
  if (compress !== undefined) {
    shortcuts.push({ id: "compress", href: compress.href });
  }

  if (hasConvert) {
    shortcuts.push({
      id: "convert",
      href: `${MARKETING_PATHS.tools}#convert`,
    });
  }

  const ocr = tools.get(SHORTCUT_TOOLS.ocr);
  if (ocr !== undefined) {
    shortcuts.push({ id: "ocr", href: ocr.href });
  }

  const protect = tools.get(SHORTCUT_TOOLS.protect);
  if (protect !== undefined) {
    shortcuts.push({ id: "protect", href: protect.href });
  }

  return shortcuts;
}

export function toolPageConflictsWithReservedPath(
  tool: Pick<ToolDefinition, "id" | "route">,
  reservedPaths: readonly string[],
): boolean {
  return reservedPaths.some(
    (path) => path === tool.route || path === `/${tool.id}`,
  );
}
