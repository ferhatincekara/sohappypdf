import { describe, expect, test } from "bun:test";
import { deriveResultFilename } from "./derive-result-filename";

describe("deriveResultFilename", () => {
  test("replaces the source extension with the result format", () => {
    expect(deriveResultFilename("contract.pdf", "pdf")).toBe("contract.pdf");
    expect(deriveResultFilename("report.pdf", "jpg")).toBe("report.jpg");
    expect(deriveResultFilename("notes", "txt")).toBe("notes.txt");
  });

  test("returns null when a display name cannot be derived", () => {
    expect(deriveResultFilename(null, "pdf")).toBeNull();
    expect(deriveResultFilename("  ", "pdf")).toBeNull();
    expect(deriveResultFilename("file.pdf", "")).toBeNull();
  });
});
