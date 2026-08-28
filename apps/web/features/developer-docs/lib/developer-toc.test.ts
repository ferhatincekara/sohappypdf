import { describe, expect, test } from "bun:test";
import {
  DEVELOPER_TOC_IDS,
  DEVELOPER_TOC_OFFSET_PX,
  resolveActiveTocId,
} from "./developer-toc";

describe("developer toc", () => {
  test("keeps the documented section order", () => {
    expect(DEVELOPER_TOC_IDS).toEqual([
      "quickstart",
      "auth",
      "files",
      "conversions",
      "tools",
      "errors",
      "limits",
    ]);
  });

  test("selects the first section before any heading reaches the offset", () => {
    expect(
      resolveActiveTocId(
        [
          { id: "quickstart", top: 400 },
          { id: "auth", top: 900 },
        ],
        DEVELOPER_TOC_OFFSET_PX,
      ),
    ).toBe("quickstart");
  });

  test("selects the last section that has crossed the offset", () => {
    expect(
      resolveActiveTocId(
        [
          { id: "quickstart", top: 40 },
          { id: "auth", top: 100 },
          { id: "files", top: 500 },
        ],
        DEVELOPER_TOC_OFFSET_PX,
      ),
    ).toBe("auth");
  });

  test("stays on the last section after scrolling past every heading", () => {
    expect(
      resolveActiveTocId(
        [
          { id: "errors", top: -800 },
          { id: "limits", top: -40 },
        ],
        DEVELOPER_TOC_OFFSET_PX,
      ),
    ).toBe("limits");
  });

  test("returns undefined when there are no sections", () => {
    expect(resolveActiveTocId([])).toBeUndefined();
  });
});
