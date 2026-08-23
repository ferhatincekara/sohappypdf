import { describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import {
  createJobTempDirectory,
  joinJobPath,
  removeJobTempDirectory,
} from "../temp/job-temp-directory.js";
import { createImagePdfEngine } from "./image-pdf-engine.js";

const ONE_PIXEL_PNG = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0,
  0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120,
  156, 99, 248, 207, 192, 80, 15, 0, 4, 133, 1, 128, 161, 152, 140, 33, 0, 0, 0,
  0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

describe("image PDF engine", () => {
  test("embeds a PNG into a PDF without system binaries", async () => {
    const directory = await createJobTempDirectory(
      "550e8400-e29b-41d4-a716-446655440200",
    );

    try {
      const sourcePath = joinJobPath(directory, "source.png");
      await writeFile(sourcePath, ONE_PIXEL_PNG);
      const result = await createImagePdfEngine().convert({
        type: "png-to-pdf",
        sourcePath,
        outputDirectory: directory,
        sourceFormat: "png",
        targetFormat: "pdf",
        options: { type: "png-to-pdf" },
        additionalSourcePaths: [],
      });

      const output = await readFile(result.outputPath);
      expect(result.filename).toBe("output.pdf");
      expect(output.subarray(0, 4).toString()).toBe("%PDF");
    } finally {
      await removeJobTempDirectory(directory);
    }
  });
});
