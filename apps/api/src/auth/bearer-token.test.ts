import { describe, expect, test } from "bun:test";
import { getBearerToken } from "./bearer-token.js";

describe("getBearerToken", () => {
  test("reads a Bearer token without inspecting other headers", () => {
    expect(getBearerToken(new Headers())).toBeUndefined();
    expect(
      getBearerToken(new Headers({ authorization: "Bearer shpdf_test" })),
    ).toBe("shpdf_test");
    expect(
      getBearerToken(new Headers({ authorization: "Basic abc" })),
    ).toBeUndefined();
  });
});
