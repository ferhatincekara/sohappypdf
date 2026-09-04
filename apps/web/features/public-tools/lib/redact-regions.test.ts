import { describe, expect, test } from "bun:test";
import { editorObjectsToRedactRegions } from "@/features/public-tools/lib/redact-regions";

describe("editorObjectsToRedactRegions", () => {
  test("converts fill rectangles into PDF-space regions", () => {
    expect(
      editorObjectsToRedactRegions(
        [
          {
            id: "r",
            kind: "rectangle",
            page: 1,
            x: 10,
            y: 40,
            width: 80,
            height: 20,
            rotation: 0,
            style: "fill",
          },
        ],
        { "1": 792 },
      ),
    ).toEqual([
      {
        page: 1,
        x: 10,
        y: 732,
        width: 80,
        height: 20,
      },
    ]);
  });

  test("ignores non-rectangle objects and empty selections", () => {
    expect(
      editorObjectsToRedactRegions(
        [
          {
            id: "t",
            kind: "text",
            page: 1,
            x: 0,
            y: 0,
            width: 40,
            height: 16,
            rotation: 0,
            text: "Hi",
            fontSize: 12,
          },
        ],
        { "1": 792 },
      ),
    ).toBeUndefined();
    expect(editorObjectsToRedactRegions([], { "1": 792 })).toBeUndefined();
  });
});
