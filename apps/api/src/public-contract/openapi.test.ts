import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_PLAN_LIMITS } from "@repo/billing";
import { APP_ERROR_CODES, APP_ERROR_STATUS } from "@repo/core";
import {
  createOpenApiDocument,
  DOCUMENTED_PRESIGN_EXPIRES_IN_SECONDS,
} from "./openapi.js";
import { PUBLIC_V1_PATHS } from "./public-v1-paths.js";

const checkedInOpenApiPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../docs/api/openapi.json",
);

describe("public OpenAPI contract", () => {
  test("describes the implemented v1 surface without secrets", () => {
    const document = createOpenApiDocument();
    const serialized = JSON.stringify(document);

    expect(document.openapi).toBe("3.1.0");
    expect(document.paths[PUBLIC_V1_PATHS.filesUpload]).toBeDefined();
    expect(document.paths[PUBLIC_V1_PATHS.fileComplete]).toBeDefined();
    expect(document.paths[PUBLIC_V1_PATHS.fileDownload]).toBeDefined();
    expect(document.paths[PUBLIC_V1_PATHS.conversions]).toBeDefined();
    expect(document.paths["/api/v1/api-keys"]).toBeUndefined();
    expect(document.paths["/api/v1/billing"]).toBeUndefined();
    expect(serialized).toContain("YOUR_API_KEY");
    expect(serialized).not.toContain("polar_oat_");
    expect(serialized).not.toContain("AWS_SECRET");
    expect(serialized).not.toContain("shpdf_live_");
    expect(serialized).not.toContain("objectKey");
    expect(serialized).not.toContain("S3_BUCKET");
  });

  test("keeps documented plan limits aligned with the entitlement catalog", () => {
    const description = createOpenApiDocument().info.description;

    expect(description).toContain(
      String(DEFAULT_PLAN_LIMITS.free.monthlyConversions),
    );
    expect(description).toContain(
      String(DEFAULT_PLAN_LIMITS.pro.monthlyConversions),
    );
    expect(description).toContain(
      String(DEFAULT_PLAN_LIMITS.free.apiRequestsPerMinute),
    );
    expect(description).toContain(
      String(DEFAULT_PLAN_LIMITS.pro.apiRequestsPerMinute),
    );
    expect(description).toContain(
      String(DOCUMENTED_PRESIGN_EXPIRES_IN_SECONDS),
    );
  });

  test("keeps the checked-in OpenAPI document in sync", async () => {
    const documented = JSON.parse(await readFile(checkedInOpenApiPath, "utf8"));
    expect(documented).toEqual(createOpenApiDocument());
  });

  test("maps public error codes to the implemented HTTP statuses", () => {
    expect(APP_ERROR_STATUS[APP_ERROR_CODES.UNAUTHORIZED]).toBe(401);
    expect(APP_ERROR_STATUS[APP_ERROR_CODES.FORBIDDEN]).toBe(403);
    expect(APP_ERROR_STATUS[APP_ERROR_CODES.PLAN_LIMIT_REACHED]).toBe(403);
    expect(APP_ERROR_STATUS[APP_ERROR_CODES.NOT_FOUND]).toBe(404);
    expect(APP_ERROR_STATUS[APP_ERROR_CODES.CONFLICT]).toBe(409);
    expect(APP_ERROR_STATUS[APP_ERROR_CODES.FILE_TOO_LARGE]).toBe(413);
    expect(APP_ERROR_STATUS[APP_ERROR_CODES.VALIDATION_ERROR]).toBe(400);
    expect(APP_ERROR_STATUS[APP_ERROR_CODES.RATE_LIMITED]).toBe(429);
    expect(APP_ERROR_CODES).not.toHaveProperty("FILE_NOT_FOUND");
    expect(APP_ERROR_CODES).not.toHaveProperty("CONVERSION_NOT_FOUND");
  });
});
