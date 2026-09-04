import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOfficeEngine } from "./office-engine.js";

const HTML_XML_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<pdf2xml>
  <page number="1" position="absolute" top="0" left="0" height="792" width="612">
    <fontspec id="0" size="28" family="Helvetica-Bold" color="#111111"/>
    <text top="158" left="214" width="187" height="31" font="0"><b>Recovery Kit</b></text>
  </page>
</pdf2xml>`;

describe("office engine", () => {
  test("rebuilds a styled document from Poppler XML, then exports DOCX", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440220",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, "%PDF-1.4\n");
      const engine = createOfficeEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        async runCommand(input) {
          calls.push(input);

          if (input.command === "pdftohtml") {
            const prefix = input.args[input.args.length - 1];
            if (prefix !== undefined) {
              await writeFile(`${prefix}.xml`, HTML_XML_FIXTURE);
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
        type: "pdf-to-word",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "docx",
        options: { type: "pdf-to-word" },
        additionalSourcePaths: [],
      });

      expect(calls).toHaveLength(2);
      expect(calls[0]?.command).toBe("pdftohtml");
      expect(calls[0]?.args).toContain("-xml");
      expect(calls[1]?.command).toBe("soffice");
      expect(calls[1]?.args.some((arg) => arg.endsWith("document.html"))).toBe(
        true,
      );
      expect(calls[1]?.args).toContain("--infilter=HTML (StarWriter)");
      expect(calls[1]?.args.includes("--infilter=writer_pdf_import")).toBe(
        false,
      );
      expect(result.filename).toBe("output.docx");
    } finally {
      await workspace.cleanup();
    }
  });
});
