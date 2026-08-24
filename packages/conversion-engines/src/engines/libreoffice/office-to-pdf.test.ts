import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOfficeEngine } from "./office-engine.js";

describe("office engine office-to-pdf", () => {
  test("converts a Word document to PDF with LibreOffice", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440230",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("source.docx");
      await writeFile(sourcePath, Buffer.from([80, 75, 3, 4, 0, 0, 0, 0]));
      const engine = createOfficeEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        async runCommand(input) {
          calls.push(input);
          const outputDirectory = workspace.join("lo-out");
          await mkdir(outputDirectory, { recursive: true });
          await writeFile(
            `${outputDirectory}/source.pdf`,
            Buffer.from("%PDF-1.4\n"),
          );
        },
      });

      const result = await engine.convert({
        type: "word-to-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "docx",
        targetFormat: "pdf",
        options: { type: "word-to-pdf" },
        additionalSourcePaths: [],
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.command).toBe("soffice");
      expect(calls[0]?.args).toContain("--convert-to");
      expect(calls[0]?.args).toContain("pdf");
      expect(calls[0]?.args.includes("--infilter=writer_pdf_import")).toBe(
        false,
      );
      expect(result.filename).toBe("output.pdf");
    } finally {
      await workspace.cleanup();
    }
  });
});
