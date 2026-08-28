import { describe, expect, test } from "bun:test";
import { isUiKitEnabled } from "./is-ui-kit-enabled";

describe("ui kit availability", () => {
  test("stays off outside next dev", () => {
    expect(isUiKitEnabled()).toBe(process.env.NODE_ENV === "development");
    expect(process.env.NODE_ENV).not.toBe("development");
    expect(isUiKitEnabled()).toBe(false);
  });
});
