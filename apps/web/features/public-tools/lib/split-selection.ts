import { rangesToPages } from "../pdf-workspace/lib/page-selection";
import { parseSplitRangesInput } from "./tool-workspace";

export function selectedPagesFromSplitRanges(value: string): number[] {
  const ranges = parseSplitRangesInput(value);
  return ranges === undefined ? [] : rangesToPages(ranges);
}
