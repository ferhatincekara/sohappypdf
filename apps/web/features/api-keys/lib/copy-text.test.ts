import { describe, expect, mock, test } from "bun:test";
import { copyTextToClipboard } from "./copy-text";

describe("copyTextToClipboard", () => {
  const originalNavigator = globalThis.navigator;

  test("copies through the clipboard API without returning the secret", async () => {
    const writeText = mock(async () => undefined);
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { clipboard: { writeText } },
    });

    const secret = "shpdf_testkey_secret_value_for_unit_tests_only";
    const copied = await copyTextToClipboard(secret);

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith(secret);
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  test("fails safely when the clipboard API is unavailable", async () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {},
    });

    await expect(copyTextToClipboard("secret")).resolves.toBe(false);
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });
});
