import { describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createPdfImageEngine } from "./pdf-image-engine.js";

const ONE_PIXEL_PNG = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0,
  0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120,
  156, 99, 248, 207, 192, 80, 15, 0, 4, 133, 1, 128, 161, 152, 140, 33, 0, 0, 0,
  0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

describe("pdf image engine", () => {
  test("builds pdftoppm arguments as an array", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440221",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, "%PDF-1.4\n");
      const engine = createPdfImageEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        async runCommand(input) {
          calls.push(input);
          await writeFile(workspace.join("page.png"), ONE_PIXEL_PNG);
        },
      });

      const result = await engine.convert({
        type: "pdf-to-png",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "png",
        options: { type: "pdf-to-png", page: 2, dpi: 72 },
        additionalSourcePaths: [],
      });

      expect(calls[0]?.command).toBe("pdftoppm");
      expect(calls[0]?.args).toEqual([
        "-png",
        "-singlefile",
        "-r",
        "72",
        "-f",
        "2",
        "-l",
        "2",
        sourcePath,
        workspace.join("page"),
      ]);
      expect(result.filename).toBe("output.png");
    } finally {
      await workspace.cleanup();
    }
  });
});
