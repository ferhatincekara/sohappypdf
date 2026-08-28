import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import { loadAiConfig } from "./ai-config.js";

describe("loadAiConfig", () => {
  test("loads monthly AI credit grants", () => {
    expect(loadAiConfig({}).freeMonthlyCredits).toBe(0);
    expect(loadAiConfig({}).proMonthlyCredits).toBe(200);
    expect(
      loadAiConfig({ FREE_AI_CREDITS: "25", PRO_AI_CREDITS: "400" })
        .freeMonthlyCredits,
    ).toBe(25);
    expect(
      loadAiConfig({ FREE_AI_CREDITS: "25", PRO_AI_CREDITS: "400" })
        .proMonthlyCredits,
    ).toBe(400);
  });

  test("rejects invalid credit values", () => {
    try {
      loadAiConfig({ FREE_AI_CREDITS: "-1" });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
