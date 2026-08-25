import { describe, expect, test } from "bun:test";
import { thumbnailOutputScale } from "./thumbnail-output-scale";

describe("thumbnail output scale", () => {
  test("caps device pixel ratio so large page grids stay light", () => {
    expect(thumbnailOutputScale(1)).toBe(1);
    expect(thumbnailOutputScale(2)).toBe(2);
    expect(thumbnailOutputScale(3)).toBe(2);
    expect(thumbnailOutputScale(0)).toBe(1);
  });
});
