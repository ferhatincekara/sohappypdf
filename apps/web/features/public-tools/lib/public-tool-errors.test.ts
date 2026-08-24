import { describe, expect, test } from "bun:test";
import axios from "axios";
import { ConversionApiRequestError } from "@/features/conversions/api/conversion-api";
import { FileApiRequestError } from "@/features/files/api/file-api";
import {
  isExpirationResponse,
  isRetryableToolError,
  mapPublicToolError,
  toToolUserError,
} from "./public-tool-errors";
import { validateToolProcess } from "./validate-tool-process";
import { createWorkspaceFiles } from "./workspace-files";

function createAxiosError(status: number, code: string): axios.AxiosError {
  return new axios.AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_REQUEST",
    { url: "/api/v1/files/x/download", method: "post" },
    undefined,
    {
      status,
      statusText: status === 410 ? "Gone" : "Not Found",
      headers: {},
      config: { url: "/api/v1/files/x/download" },
      data: {
        error: {
          code,
          message: "internal stack / AccessDenied",
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
  });
});
