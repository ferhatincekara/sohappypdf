import { describe, expect, test } from "bun:test";
import {
  zoomToFitPage,
  zoomToFitWidth,
} from "@/features/pdf-document-editor/lib/editor-zoom";

describe("editor zoom helpers", () => {
  test("fits width and page within zoom bounds", () => {
    expect(zoomToFitWidth(612, 900)).toBeGreaterThan(1);
    expect(zoomToFitWidth(612, 200)).toBe(0.5);
    expect(zoomToFitPage(612, 792, 900, 400)).toBeLessThan(
      zoomToFitWidth(612, 900),
    );
    expect(zoomToFitWidth(0, 800)).toBe(1);
  });
});
