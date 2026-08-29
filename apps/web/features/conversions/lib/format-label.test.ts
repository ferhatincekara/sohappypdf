import { describe, expect, test } from "bun:test";
import { conversionFormatLabel } from "@/features/conversions/lib/format-label";

describe("conversionFormatLabel", () => {
  test("translates known formats and uppercases unknown ones", () => {
    expect(conversionFormatLabel("pdf", (key) => key.toUpperCase())).toBe(
      "PDF",
    );
    expect(conversionFormatLabel("unknown", () => "unused")).toBe("UNKNOWN");
  });
});
