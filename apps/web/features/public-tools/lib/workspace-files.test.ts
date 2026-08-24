import { describe, expect, test } from "bun:test";
import { formatAcceptedFormats } from "./format-labels";
import { resolveToolProcessingPhase } from "./processing-phase";
import { mapConversionFailure } from "./public-tool-errors";
import {
  appendWorkspaceFiles,
  createWorkspaceFiles,
  moveWorkspaceFile,
  reorderWorkspaceFile,
} from "./workspace-files";

describe("workspace files", () => {
  test("creates, appends, moves, and reorders selected files", () => {
    const first = createWorkspaceFiles(
      [new File(["a"], "a.pdf", { type: "application/pdf" })],
      {
        createId: () => "1",
        createPreview: () => null,
      },
    );
    const second = createWorkspaceFiles(
      [new File(["b"], "b.pdf", { type: "application/pdf" })],
      {
        createId: () => "2",
        createPreview: () => null,
      },
    );

    const appended = appendWorkspaceFiles(first, second, 5);
    expect(appended.rejected).toBeNull();
    expect(appended.files.map((file) => file.id)).toEqual(["1", "2"]);

    const moved = moveWorkspaceFile(appended.files, 1, -1);
    expect(moved.map((file) => file.id)).toEqual(["2", "1"]);

    const reordered = reorderWorkspaceFile(moved, 0, 1);
    expect(reordered.map((file) => file.id)).toEqual(["1", "2"]);
  });

  test("rejects files beyond the max count", () => {
    const current = createWorkspaceFiles(
      [new File(["a"], "a.pdf", { type: "application/pdf" })],
      { createId: () => "1", createPreview: () => null },
    );
    const incoming = createWorkspaceFiles(
      [
        new File(["b"], "b.pdf", { type: "application/pdf" }),
        new File(["c"], "c.pdf", { type: "application/pdf" }),
      ],
      {
        createId: (() => {
          let n = 2;
          return () => String(n++);
        })(),
        createPreview: () => null,
      },
    );

    const result = appendWorkspaceFiles(current, incoming, 2);
    expect(result.rejected).toBe("tooManyFiles");
    expect(result.files).toHaveLength(2);
  });
});

describe("processing phase", () => {
  test("maps conversion and upload states honestly", () => {
    expect(
      resolveToolProcessingPhase({
        hasError: false,
        isCreatingConversion: false,
        fileStatuses: ["uploading"],
        conversionStatus: undefined,
      }),
    ).toBe("uploading");

    expect(
      resolveToolProcessingPhase({
        hasError: false,
        isCreatingConversion: true,
        fileStatuses: ["ready"],
        conversionStatus: undefined,
      }),
    ).toBe("preparing");

    expect(
      resolveToolProcessingPhase({
        hasError: false,
        isCreatingConversion: false,
        fileStatuses: ["ready"],
        conversionStatus: "processing",
      }),
    ).toBe("processing");

    expect(
      resolveToolProcessingPhase({
        hasError: false,
        isCreatingConversion: false,
        fileStatuses: ["ready"],
        conversionStatus: "completed",
      }),
    ).toBe("ready");
  });
});

describe("format labels", () => {
  test("joins accepted formats for display", () => {
    expect(formatAcceptedFormats(["pdf"], "and")).toBe("PDF");
    expect(formatAcceptedFormats(["pdf", "png"], "and")).toBe("PDF and PNG");
    expect(formatAcceptedFormats(["pdf", "jpg", "png"], "and")).toBe(
      "PDF, JPG, and PNG",
    );
  });
});

describe("public tool errors", () => {
  test("maps password-protected conversion failures", () => {
    expect(
      mapConversionFailure({
        code: "processing_failed",
        message: "PDF is password protected",
      }),
    ).toBe("passwordProtected");
  });
});
