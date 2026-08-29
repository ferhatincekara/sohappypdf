import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { createConversionWorkspace } from "./temp-workspace.js";
import { writeZipArchive } from "./write-zip.js";

describe("writeZipArchive", () => {
  test("writes a PK-prefixed archive with the given files", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440240",
    );

    try {
      const outputPath = workspace.join("pages.zip");
      await writeZipArchive(outputPath, [
        { name: "page-1.txt", data: new TextEncoder().encode("one") },
        { name: "page-2.txt", data: new TextEncoder().encode("two") },
      ]);

      const bytes = await readFile(outputPath);
      expect(bytes.subarray(0, 2)).toEqual(Uint8Array.from([80, 75]));
      expect(bytes.byteLength).toBeGreaterThan(40);
    } finally {
      await workspace.cleanup();
    }
  });
});
