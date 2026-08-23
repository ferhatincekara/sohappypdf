import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOfficeEngine } from "./office-engine.js";

describe("office engine", () => {
  test("builds LibreOffice arguments without a shell string", async () => {
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
          const outputDirectory = workspace.join("lo-out");
          await mkdir(outputDirectory, { recursive: true });
          await writeFile(
            `${outputDirectory}/source.docx`,
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

      expect(calls).toHaveLength(1);
      expect(calls[0]?.command).toBe("soffice");
      expect(calls[0]?.args).toContain("--headless");
      expect(calls[0]?.args).toContain("--convert-to");
      expect(calls[0]?.args).toContain("docx");
      expect(calls[0]?.args.includes(sourcePath)).toBe(true);
      expect(result.filename).toBe("output.docx");
    } finally {
      await workspace.cleanup();
    }
  });
});
