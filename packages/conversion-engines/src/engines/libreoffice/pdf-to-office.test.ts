import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOfficeEngine } from "./office-engine.js";

const LAYOUT_FIXTURE = `<doc>
  <page width="612" height="792">
    <block xMin="110" yMin="450" xMax="153" yMax="460">
      <line xMin="110" yMin="450" xMax="153" yMax="460">
        <word xMin="110" yMin="450" xMax="153" yMax="460">alpha</word>
      </line>
    </block>
    <block xMin="210" yMin="450" xMax="268" yMax="460">
      <line xMin="210" yMin="450" xMax="268" yMax="460">
        <word xMin="210" yMin="450" xMax="268" yMax="460">bravo</word>
      </line>
    </block>
  </page>
</doc>`;

describe("office engine pdf-to-spreadsheet", () => {
  test("rebuilds a spreadsheet from Poppler layout, then exports XLSX", async () => {
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
            `${outputDirectory}/spreadsheet.xlsx`,
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

      expect(calls).toHaveLength(2);
      expect(calls[0]?.command).toBe("pdftotext");
      expect(calls[0]?.args).toContain("-bbox-layout");
      expect(calls[1]?.command).toBe("soffice");
      expect(
        calls[1]?.args.some((arg) => arg.endsWith("spreadsheet.html")),
      ).toBe(true);
      expect(calls[1]?.args).toContain("--infilter=HTML (StarCalc)");
      expect(calls[1]?.args.includes("--infilter=calc_pdf_import")).toBe(false);
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
