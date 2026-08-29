import { describe, expect, test } from "bun:test";
import {
  clampCropMargins,
  moveCropMargins,
  resizeCropEdge,
} from "@/features/public-tools/lib/crop-margins";

describe("crop margins", () => {
  test("keeps a usable crop area inside the page", () => {
    expect(
      clampCropMargins(
        { top: 800, right: 800, bottom: 800, left: 800 },
        612,
        792,
      ),
    ).toEqual({
      top: 268,
      right: 88,
      bottom: 500,
      left: 500,
    });
  });

  test("moves the crop box without shrinking it past the page", () => {
    expect(
      moveCropMargins(
        { top: 40, right: 40, bottom: 40, left: 40 },
        20,
        -10,
        612,
        792,
      ),
    ).toEqual({
      top: 30,
      right: 20,
      bottom: 50,
      left: 60,
    });
  });

  test("resizes a single edge", () => {
    expect(
      resizeCropEdge(
        { top: 36, right: 36, bottom: 36, left: 36 },
        "left",
        12,
        612,
        792,
      ),
    ).toEqual({
      top: 36,
      right: 36,
      bottom: 36,
      left: 48,
    });
  });
});
