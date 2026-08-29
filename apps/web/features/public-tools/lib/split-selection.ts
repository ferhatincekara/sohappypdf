import { parseSplitRangesInput } from "@/features/public-tools/lib/tool-workspace";
import { rangesToPages } from "@/features/public-tools/pdf-workspace/lib/page-selection";

export function selectedPagesFromSplitRanges(value: string): number[] {
  const ranges = parseSplitRangesInput(value);
  return ranges === undefined ? [] : rangesToPages(ranges);
}
