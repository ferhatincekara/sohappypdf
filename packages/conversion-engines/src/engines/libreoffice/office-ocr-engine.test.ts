import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOfficeOcrEngine } from "./office-ocr-engine.js";

const LAYOUT_FIXTURE = `<doc>
  <page width="612" height="792">
    <block xMin="214" yMin="158" xMax="401" yMax="189">
      <line xMin="214" yMin="158" xMax="401" yMax="189">
        <word xMin="214" yMin="158" xMax="353" yMax="189">Recovery</word>
      </line>
    </block>
  </page>
</doc>`;

describe("office ocr engine", () => {
  test("OCRs a PDF then exports DOCX", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440233",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, "%PDF-1.4\n");
      const engine = createOfficeOcrEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        isBinaryAvailable: () => true,
        async runCommand(input) {
          calls.push(input);

          if (input.command === "ocrmypdf") {
            const outputPath = input.args[input.args.length - 1];
            if (outputPath !== undefined) {
              await writeFile(outputPath, "%PDF-1.4\n");
            }
            return;
          }

          if (input.command === "pdftotext") {
            const outputPath = input.args[input.args.length - 1];
            if (outputPath !== undefined) {
              await writeFile(outputPath, LAYOUT_FIXTURE);
            }
            return;
          }

          const outputDirectory = workspace.join("lo-out");
          await mkdir(outputDirectory, { recursive: true });
          await writeFile(
            `${outputDirectory}/document.docx`,
            Buffer.from([80, 75, 3, 4, 0, 0, 0, 0]),
          );
        },
      });

      const result = await engine.convert({
        type: "pdf-to-word-ocr",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "docx",
        options: { type: "pdf-to-word-ocr", language: "eng" },
        additionalSourcePaths: [],
      });

      expect(calls[0]?.command).toBe("ocrmypdf");
      expect(calls[0]?.args).toContain("--skip-text");
      expect(calls[0]?.args).toContain("--invalidate-digital-signatures");
      expect(calls[0]?.acceptExitCodes).toEqual([0, 6]);
      expect(calls.some((call) => call.command === "soffice")).toBe(true);
      expect(result.filename).toBe("output.docx");
    } finally {
      await workspace.cleanup();
    }
  });
});
