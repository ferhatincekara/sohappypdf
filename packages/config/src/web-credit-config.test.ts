import { describe, expect, test } from "bun:test";
import {
  DEFAULT_FREE_WEB_TOOL_CREDITS,
  DEFAULT_PRO_WEB_TOOL_CREDITS,
  loadWebCreditConfig,
} from "./web-credit-config.js";

describe("loadWebCreditConfig", () => {
  test("uses defaults when env is unset", () => {
    expect(loadWebCreditConfig({})).toEqual({
      freeMonthlyCredits: DEFAULT_FREE_WEB_TOOL_CREDITS,
      proMonthlyCredits: DEFAULT_PRO_WEB_TOOL_CREDITS,
    });
  });

  test("reads configured values from env", () => {
    expect(
      loadWebCreditConfig({
        FREE_WEB_TOOL_CREDITS: "150",
        PRO_WEB_TOOL_CREDITS: "3000",
      }),
    ).toEqual({
      freeMonthlyCredits: 150,
      proMonthlyCredits: 3000,
    });
  });
});
