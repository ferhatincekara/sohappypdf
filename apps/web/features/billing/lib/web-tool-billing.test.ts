import { describe, expect, test } from "bun:test";
import { parseWebToolBilling } from "./web-tool-billing";

describe("parseWebToolBilling", () => {
  test("reads plan file limits from a billing status payload", () => {
    expect(
      parseWebToolBilling({
        billing: {
          plan: "pro",
          limits: {
            maxFilesPerOperation: null,
            maxFileSizeBytes: 1024,
            maxPagesPerFile: null,
          },
        },
      }),
    ).toEqual({
      plan: "pro",
      maxFilesPerOperation: null,
      maxFileSizeBytes: 1024,
      maxPagesPerFile: null,
    });
    expect(
      parseWebToolBilling({
        billing: {
          plan: "free",
          limits: {
            maxFilesPerOperation: 1,
            maxFileSizeBytes: 20,
            maxPagesPerFile: 50,
          },
        },
      }),
    ).toEqual({
      plan: "free",
      maxFilesPerOperation: 1,
      maxFileSizeBytes: 20,
      maxPagesPerFile: 50,
    });
    expect(parseWebToolBilling({ billing: { plan: "pro" } })).toBeNull();
  });
});
