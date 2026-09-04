import { findRegisteredTool } from "@sohappypdf/tools/catalog";
import {
  getMarketingToolNavItems,
  type MarketingToolNavItem,
} from "@/features/marketing/lib/marketing-tools";

export const MEGA_MENU_SECTION_IDS = [
  "popular",
  "organize",
  "convertFrom",
  "convertTo",
  "edit",
  "security",
] as const;

export type MegaMenuSectionId = (typeof MEGA_MENU_SECTION_IDS)[number];

export type MegaMenuSection = {
  id: MegaMenuSectionId;
  tools: readonly MarketingToolNavItem[];
};

const MEGA_MENU_TOOL_IDS: Record<MegaMenuSectionId, readonly string[]> = {
  popular: [
    "merge-pdf",
    "split-pdf",
    "compress-pdf",
    "pdf-to-word",
    "edit-pdf",
    "ocr-pdf",
  ],
  organize: [
    "merge-pdf",
    "split-pdf",
    "organize-pdf",
    "extract-pages",
    "remove-pages",
    "rotate-pdf",
  ],
  convertFrom: [
    "pdf-to-word",
    "pdf-to-excel",
    "pdf-to-powerpoint",
    "pdf-to-jpg",
    "pdf-to-png",
  ],
  convertTo: [
    "word-to-pdf",
    "excel-to-pdf",
    "powerpoint-to-pdf",
    "jpg-to-pdf",
    "png-to-pdf",
  ],
  edit: ["edit-pdf", "watermark-pdf", "page-numbers-pdf", "sign-pdf"],
  security: ["protect-pdf", "unlock-pdf", "redact-pdf", "compare-pdf"],
};

export function getMegaMenuSections(): readonly MegaMenuSection[] {
  const items = new Map(
    getMarketingToolNavItems().map((item) => [item.id, item]),
  );

  return MEGA_MENU_SECTION_IDS.flatMap((id) => {
    const tools = MEGA_MENU_TOOL_IDS[id].flatMap((toolId) => {
      const item = items.get(toolId);
      const catalog = findRegisteredTool(toolId);

      if (item === undefined || catalog === undefined) {
        return [];
      }

      return [item];
    });

    if (tools.length === 0) {
      return [];
    }

    return [{ id, tools }];
  });
}
