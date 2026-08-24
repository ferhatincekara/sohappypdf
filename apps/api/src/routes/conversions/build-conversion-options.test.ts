import { describe, expect, test } from "bun:test";
import { buildConversionRequestOptions } from "./build-conversion-options.js";

describe("buildConversionRequestOptions", () => {
  test("omits empty additional file ids", () => {
    expect(
      buildConversionRequestOptions({
        additionalFileIds: [],
      }),
    ).toBeUndefined();
  });

  test("merges tool options with additional file ids", () => {
    expect(
      buildConversionRequestOptions({
        additionalFileIds: ["file-2"],
        options: { degrees: 90 },
      }),
    ).toEqual({
      degrees: 90,
      additionalFileIds: ["file-2"],
    });
  });
});
