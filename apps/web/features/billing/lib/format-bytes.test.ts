import { describe, expect, test } from "bun:test";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  test("formats common plan sizes", () => {
    expect(formatBytes(20 * 1024 * 1024)).toBe("20 MB");
    expect(formatBytes(10 * 1024 * 1024 * 1024)).toBe("10 GB");
  });
});
