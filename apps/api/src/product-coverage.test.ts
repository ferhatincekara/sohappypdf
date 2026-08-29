import { describe, expect, test } from "bun:test";
import { DEFAULT_PLAN_LIMITS } from "@repo/billing";
import { DEFAULT_ANONYMOUS_CONFIG } from "@repo/config";
import { isConversionImplemented, isConversionType } from "@repo/conversions";
import { isAppError } from "@repo/core";
import { FILE_EXPIRED_MESSAGE } from "@repo/files";
import {
  isAnonymousToolAllowed,
  listCatalogTools,
  listRegisteredTools,
} from "@repo/tools";
import { createOpenApiDocument } from "./public-contract/openapi.js";
import { resolveAnonymousConversionRequest } from "./routes/anonymous/anonymous-schemas.js";

const SOURCE_FILE_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("end-to-end product coverage", () => {
  test("every public executable tool has a live processor and conversion engine", () => {
    const registered = listRegisteredTools();
    const planned = listCatalogTools().filter(
      (tool) => tool.availability === "planned",
    );

    expect(registered.length).toBeGreaterThan(0);
    expect(planned.map((tool) => tool.id).sort()).toEqual(
      [
        "ai-summarizer",
        "image-to-pdf",
        "pdf-forms",
        "translate-pdf",
        "web-to-pdf",
      ].sort(),
    );

    for (const tool of registered) {
      expect(isConversionType(tool.id)).toBe(true);
      if (isConversionType(tool.id)) {
        expect(isConversionImplemented(tool.id)).toBe(true);
      }
    }

    for (const tool of planned) {
      expect(isAnonymousToolAllowed(tool.id)).toBe(false);
    }
  });

  test("anonymous users cannot start premium or planned tools", () => {
    const blocked = [
      "protect-pdf",
      "unlock-pdf",
      "ocr-pdf",
      "sign-pdf",
      "ai-summarizer",
      "translate-pdf",
      "web-to-pdf",
    ] as const;

    for (const type of blocked) {
      expect(isAnonymousToolAllowed(type)).toBe(false);
      try {
        resolveAnonymousConversionRequest(
          { sourceFileId: SOURCE_FILE_ID, type },
          DEFAULT_ANONYMOUS_CONFIG,
        );
        throw new Error(`expected ${type} to be rejected`);
      } catch (error) {
        expect(isAppError(error)).toBe(true);
      }
    }

    const allowed = resolveAnonymousConversionRequest(
      { sourceFileId: SOURCE_FILE_ID, type: "pdf-to-png" },
      DEFAULT_ANONYMOUS_CONFIG,
    );
    expect(allowed.type).toBe("pdf-to-png");
  });

  test("Free AI credits stay at zero so Pro-only AI tools cannot run on Free", () => {
    expect(DEFAULT_PLAN_LIMITS.free.monthlyAiCredits).toBe(0);
    expect(DEFAULT_PLAN_LIMITS.pro.monthlyAiCredits).toBeGreaterThan(0);
    expect(DEFAULT_PLAN_LIMITS.pro.monthlyWebCredits).toBeGreaterThan(
      DEFAULT_PLAN_LIMITS.free.monthlyWebCredits,
    );
    expect(DEFAULT_PLAN_LIMITS.pro.maxFileSizeBytes).toBeGreaterThan(
      DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes,
    );
  });

  test("expired files use the product-level message", () => {
    expect(FILE_EXPIRED_MESSAGE).toBe(
      "This file has expired. Please process it again.",
    );
  });

  test("the public OpenAPI contract does not publish admin routes", () => {
    const paths = Object.keys(createOpenApiDocument().paths);
    expect(paths.some((path) => path.includes("/admin"))).toBe(false);
  });
});
