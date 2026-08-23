import { describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { isPermanentConversionError } from "./errors.js";
import { validateConversionOutput } from "./output-validation.js";
import { createConversionWorkspace } from "./workspace/temp-workspace.js";

describe("output validation", () => {
  test("accepts a PDF header and rejects an empty or mismatched file", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440210",
    );

    try {
      const pdfPath = workspace.join("output.pdf");
      await writeFile(pdfPath, "%PDF-1.4\n");
      expect(
        await validateConversionOutput({
          outputPath: pdfPath,
          expectedFormat: "pdf",
        }),
      ).toEqual({ sizeBytes: 9 });

      const emptyPath = workspace.join("empty.pdf");
      await writeFile(emptyPath, "");
      try {
        await validateConversionOutput({
          outputPath: emptyPath,
          expectedFormat: "pdf",
        });
        throw new Error("expected empty output to fail");
      } catch (error) {
        expect(isPermanentConversionError(error)).toBe(true);
      }

      const pngPath = workspace.join("output.png");
      await writeFile(pngPath, "%PDF-1.4\n");
      try {
        await validateConversionOutput({
          outputPath: pngPath,
          expectedFormat: "png",
        });
        throw new Error("expected mismatched type to fail");
      } catch (error) {
        expect(isPermanentConversionError(error)).toBe(true);
      }
    } finally {
      await workspace.cleanup();
    }
  });
});
