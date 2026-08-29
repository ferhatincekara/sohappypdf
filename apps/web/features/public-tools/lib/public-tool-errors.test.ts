import { describe, expect, test } from "bun:test";
import axios from "axios";
import { ConversionApiRequestError } from "@/features/conversions/api/conversion-api";
import { FileApiRequestError } from "@/features/files/api/file-api";
import {
  isExpirationResponse,
  isPlanUpgradeToolError,
  isRetryableToolError,
  mapConversionFailure,
  mapPublicToolError,
  publicToolErrorMessageValues,
  toToolUserError,
} from "@/features/public-tools/lib/public-tool-errors";
import { validateToolProcess } from "@/features/public-tools/lib/validate-tool-process";
import { createWorkspaceFiles } from "@/features/public-tools/lib/workspace-files";

function createAxiosError(
  status: number,
  code: string,
  message = "internal stack / AccessDenied",
): axios.AxiosError {
  return new axios.AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_REQUEST",
    { url: "/v1/files/x/download", method: "post" },
    undefined,
    {
      status,
      statusText: status === 410 ? "Gone" : "Not Found",
      headers: {},
      config: { url: "/v1/files/x/download" },
      data: {
        error: {
          code,
          message,
        },
      },
    } as never,
  );
}

describe("tool user errors", () => {
  test("marks only safe operational failures as retryable", () => {
    expect(isRetryableToolError("networkFailure")).toBe(true);
    expect(isRetryableToolError("processingFailed")).toBe(true);
    expect(isRetryableToolError("signInRequired")).toBe(false);
    expect(isRetryableToolError("filesExpired")).toBe(false);
    expect(isRetryableToolError("passwordProtected")).toBe(false);
    expect(toToolUserError("rateLimited")).toEqual({
      key: "rateLimited",
      retryable: true,
    });
  });

  test("treats HTTP 410 as expiration without exposing internals", () => {
    const error = new FileApiRequestError(
      createAxiosError(410, "FILE_EXPIRED"),
    );

    expect(isExpirationResponse(error)).toBe(true);
    expect(mapPublicToolError(error)).toBe("filesExpired");
    expect(JSON.stringify(error.clientError)).not.toContain("AccessDenied");
    expect(JSON.stringify(error.clientError)).not.toContain("stack");
  });

  test("maps a vanished conversion resource to a start-again error", () => {
    const error = new ConversionApiRequestError(
      createAxiosError(404, "NOT_FOUND"),
    );

    expect(mapPublicToolError(error)).toBe("filesExpired");
    expect(isRetryableToolError("filesExpired")).toBe(false);
  });

  test("maps server failures without calling them upload or network errors", () => {
    expect(
      mapPublicToolError(
        new ConversionApiRequestError(createAxiosError(500, "INTERNAL_ERROR")),
      ),
    ).toBe("unexpected");
    expect(
      mapPublicToolError(
        new FileApiRequestError(createAxiosError(500, "CONFIGURATION_ERROR")),
      ),
    ).toBe("unexpected");
  });

  test("maps an unconfigured AI engine to a dedicated unavailable error", () => {
    expect(
      mapConversionFailure({
        code: "processing_failed",
        message: "AI processing is unavailable",
      }),
    ).toBe("aiUnavailable");
    expect(
      mapPublicToolError(
        new ConversionApiRequestError(
          createAxiosError(
            500,
            "CONFIGURATION_ERROR",
            "AI processing is unavailable",
          ),
        ),
      ),
    ).toBe("aiUnavailable");
    expect(isRetryableToolError("aiUnavailable")).toBe(false);
  });

  test("maps empty-file, unauthorized, and duplicate processing without internals", () => {
    expect(
      mapPublicToolError(
        new FileApiRequestError(createAxiosError(403, "FORBIDDEN")),
      ),
    ).toBe("unauthorized");
    expect(
      mapPublicToolError(
        new ConversionApiRequestError(createAxiosError(409, "CONFLICT")),
      ),
    ).toBe("duplicateExecution");
    expect(isRetryableToolError("uploadInterrupted")).toBe(true);
    expect(isRetryableToolError("unauthorized")).toBe(false);
  });

  test("maps a Pro-only tool rejection to an upgrade error", () => {
    expect(
      mapPublicToolError(
        new ConversionApiRequestError(
          createAxiosError(403, "PLAN_LIMIT_REACHED", "This tool requires Pro"),
        ),
      ),
    ).toBe("upgradeRequired");
    expect(isRetryableToolError("upgradeRequired")).toBe(false);
    expect(isPlanUpgradeToolError("tooManyPages")).toBe(true);
    expect(isPlanUpgradeToolError("upgradeRequired")).toBe(true);
    expect(publicToolErrorMessageValues("tooManyPages")).toEqual({ max: 50 });
    expect(publicToolErrorMessageValues("tooLarge")).toEqual({});
  });
});

describe("validate tool process", () => {
  test("keeps merge and option checks on the selected state path", () => {
    const files = createWorkspaceFiles(
      [new File(["a"], "a.pdf", { type: "application/pdf" })],
      { createId: () => "1", createPreview: () => null },
    );

    expect(
      validateToolProcess({
        toolId: "merge-pdf",
        allowsAnonymous: true,
        isAuthenticated: false,
        files,
        maxFiles: 1,
        options: undefined,
      }),
    ).toEqual({ ok: false, errorKey: "tooFewFiles" });

    expect(
      validateToolProcess({
        toolId: "merge-pdf",
        allowsAnonymous: true,
        isAuthenticated: false,
        files,
        maxFiles: 5,
        options: undefined,
      }),
    ).toEqual({ ok: false, errorKey: "tooFewFiles" });

    expect(
      validateToolProcess({
        toolId: "protect-pdf",
        allowsAnonymous: true,
        isAuthenticated: false,
        files: files.map((file) => ({ ...file, status: "ready" })),
        maxFiles: 1,
        options: undefined,
      }),
    ).toEqual({ ok: false, errorKey: "invalidOptions" });

    expect(
      validateToolProcess({
        toolId: "split-pdf",
        allowsAnonymous: true,
        isAuthenticated: false,
        files: files.map((file) => ({ ...file, status: "ready" })),
        maxFiles: 1,
        options: undefined,
      }),
    ).toEqual({ ok: false, errorKey: "invalidOptions" });

    expect(
      validateToolProcess({
        toolId: "split-pdf",
        allowsAnonymous: true,
        isAuthenticated: false,
        files: files.map((file) => ({ ...file, status: "ready" })),
        maxFiles: 1,
        options: { ranges: [{ start: 1, end: 2 }] },
      }),
    ).toEqual({ ok: true });

    expect(
      validateToolProcess({
        toolId: "split-pdf",
        allowsAnonymous: true,
        isAuthenticated: false,
        files: files.map((file) => ({
          ...file,
          status: "ready" as const,
          pageCount: 65,
        })),
        maxFiles: 1,
        maxPagesPerFile: 50,
        options: { ranges: [{ start: 1, end: 2 }] },
      }),
    ).toEqual({ ok: false, errorKey: "tooManyPages" });

    expect(
      validateToolProcess({
        toolId: "split-pdf",
        allowsAnonymous: true,
        isAuthenticated: false,
        files: files.map((file) => ({
          ...file,
          status: "failed" as const,
          errorKey: "tooLarge" as const,
        })),
        maxFiles: 1,
        options: { ranges: [{ start: 1, end: 2 }] },
      }),
    ).toEqual({ ok: false, errorKey: "tooLarge" });
  });
});
