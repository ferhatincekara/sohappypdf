import { describe, expect, test } from "bun:test";
import {
  BROWSER_UPLOAD_CORS_RULE_ID,
  mergeBrowserUploadCorsRules,
} from "./bucket-cors.js";

describe("mergeBrowserUploadCorsRules", () => {
  test("adds a managed rule for public site origins", () => {
    const rules = mergeBrowserUploadCorsRules(undefined, [
      "https://sohappypdf.com",
      "https://www.sohappypdf.com",
    ]);

    expect(rules).toEqual([
      {
        ID: BROWSER_UPLOAD_CORS_RULE_ID,
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "PUT", "HEAD"],
        AllowedOrigins: [
          "https://sohappypdf.com",
          "https://www.sohappypdf.com",
        ],
        ExposeHeaders: ["ETag", "Content-Length"],
        MaxAgeSeconds: 3600,
      },
    ]);
  });

  test("replaces a previous managed rule and keeps unrelated rules", () => {
    const rules = mergeBrowserUploadCorsRules(
      [
        {
          ID: BROWSER_UPLOAD_CORS_RULE_ID,
          AllowedOrigins: ["https://sohappypdf.com"],
          AllowedMethods: ["GET"],
        },
        {
          ID: "manual",
          AllowedOrigins: ["https://docs.example"],
          AllowedMethods: ["GET"],
        },
      ],
      ["https://www.sohappypdf.com"],
    );

    expect(rules).toHaveLength(2);
    expect(rules[0]?.ID).toBe("manual");
    expect(rules[1]?.AllowedOrigins).toEqual(["https://www.sohappypdf.com"]);
  });
});
