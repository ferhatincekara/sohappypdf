import { describe, expect, test } from "bun:test";
import { resolveApiCreditCost, usesApiCredits } from "./api-credit-cost.js";

describe("API credit cost", () => {
  test("uses centralized tool registry costs", () => {
    expect(resolveApiCreditCost("pdf-to-jpg")).toBe(1);
    expect(resolveApiCreditCost("pdf-to-word")).toBe(5);
    expect(usesApiCredits("pdf-to-jpg")).toBe(true);
    expect(usesApiCredits("ai-summarizer")).toBe(false);
  });
});
