import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOfficeEngine } from "./office-engine.js";

const LAYOUT_FIXTURE = `<doc>
  <page width="612" height="792">
    <block xMin="214" yMin="158" xMax="401" yMax="189">
      <line xMin="214" yMin="158" xMax="401" yMax="189">
        <word xMin="214" yMin="158" xMax="353" yMax="189">Recovery</word>
        <word xMin="363" yMin="158" xMax="401" yMax="189">Kit</word>
      </line>
    </block>
  </page>
</doc>`;

describe("office engine", () => {
  test("rebuilds a flowing document from Poppler layout, then exports DOCX", async () => {
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
        type: "pdf-to-word",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "docx",
        options: { type: "pdf-to-word" },
        additionalSourcePaths: [],
      });

      expect(calls).toHaveLength(2);
      expect(calls[0]?.command).toBe("pdftotext");
      expect(calls[0]?.args).toContain("-bbox-layout");
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
