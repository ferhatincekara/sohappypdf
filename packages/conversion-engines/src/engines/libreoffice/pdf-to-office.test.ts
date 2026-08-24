import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOfficeEngine } from "./office-engine.js";

describe("office engine pdf-to-spreadsheet", () => {
  test("imports a PDF into Calc and exports XLSX", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440231",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, "%PDF-1.4\n");
      const engine = createOfficeEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        async runCommand(input) {
          calls.push(input);
          const outputDirectory = workspace.join("lo-out");
          await mkdir(outputDirectory, { recursive: true });
          await writeFile(
            `${outputDirectory}/source.xlsx`,
            Buffer.from([80, 75, 3, 4, 0, 0, 0, 0]),
          );
        },
      });

      const result = await engine.convert({
        type: "pdf-to-excel",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "xlsx",
        options: { type: "pdf-to-excel" },
        additionalSourcePaths: [],
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.command).toBe("soffice");
      expect(calls[0]?.args).toContain("--infilter=calc_pdf_import");
      expect(calls[0]?.args).toContain("xlsx");
      expect(result.filename).toBe("output.xlsx");
    } finally {
      await workspace.cleanup();
    }
  });
});

describe("office engine pdf-to-presentation", () => {
  test("imports a PDF into Impress and exports PPTX", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440232",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, "%PDF-1.4\n");
      const engine = createOfficeEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        async runCommand(input) {
          calls.push(input);
          const outputDirectory = workspace.join("lo-out");
          await mkdir(outputDirectory, { recursive: true });
          await writeFile(
            `${outputDirectory}/source.pptx`,
            Buffer.from([80, 75, 3, 4, 0, 0, 0, 0]),
          );
        },
      });

      const result = await engine.convert({
        type: "pdf-to-powerpoint",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pptx",
        options: { type: "pdf-to-powerpoint" },
        additionalSourcePaths: [],
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.args).toContain("--infilter=impress_pdf_import");
      expect(calls[0]?.args).toContain("pptx");
      expect(result.filename).toBe("output.pptx");
    } finally {
      await workspace.cleanup();
    }
  });
});
